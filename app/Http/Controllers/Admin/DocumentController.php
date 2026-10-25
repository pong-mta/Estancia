<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentAttachment;
use App\Models\DocumentType;
use App\Models\PurchaseRequestItem;
use App\Services\DocumentWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class DocumentController extends Controller
{
    public function index(): Response
    {
        $documents = Document::query()
            ->with([
                'originatingOffice:id,name',
                'submitter:id,name',
                'purchaseRequestItems',
            ])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $documentTypes = DocumentType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'code',
                'description',
                'allows_upload',
                'allows_template',
            ]);

        return Inertia::render('admin/documents/index', [
            'documents' => $documents,
            'documentTypes' => $documentTypes,
        ]);
    }

    public function store(
        Request $request,
        DocumentWorkflowService $workflowService
    ): RedirectResponse {
        $validated = $request->validate([
            'document_type' => [
                'required',
                'string',
                'max:100',
                Rule::exists('document_types', 'code')
                    ->where('is_active', true),
            ],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'originating_office_id' => [
                'nullable',
                'integer',
                'exists:offices,id',
            ],
            'submit' => ['sometimes', 'boolean'],

            'purpose' => [
                'required_if:document_type,purchase_request',
                'nullable',
                'string',
                'max:10000',
            ],

            'requested_delivery_date' => [
                'nullable',
                'date',
                'after_or_equal:today',
            ],

            'items' => [
                'required_if:document_type,purchase_request',
                'array',
                'min:1',
            ],
            'items.*.description' => [
                'required_with:items',
                'string',
                'max:2000',
            ],
            'items.*.quantity' => [
                'required_with:items',
                'numeric',
                'gt:0',
                'max:9999999999',
            ],
            'items.*.unit' => [
                'required_with:items',
                'string',
                'max:50',
            ],
            'items.*.unit_price' => [
                'required_with:items',
                'numeric',
                'min:0',
                'max:9999999999999.99',
            ],

            'attachment' => [
                'nullable',
                File::types([
                    'pdf',
                    'doc',
                    'docx',
                    'jpg',
                    'jpeg',
                    'png',
                ])->max(20 * 1024),
            ],
        ]);

        $user = $request->user();

        abort_unless(
            $user && $user->is_active,
            403,
            'Your account is not authorized to create documents.'
        );

        $documentType = DocumentType::query()
            ->where('code', $validated['document_type'])
            ->where('is_active', true)
            ->firstOrFail();

        $attachment = $request->file('attachment');

        if ($attachment && ! $documentType->allows_upload) {
            return back()
                ->withErrors([
                    'attachment' => 'File uploads are not allowed for this document type.',
                ])
                ->withInput();
        }

        $shouldSubmit = (bool) ($validated['submit'] ?? false);
        $isPurchaseRequest = $documentType->code === 'purchase_request';

        $storedPath = null;

        try {
            $document = DB::transaction(function () use (
                $validated,
                $shouldSubmit,
                $isPurchaseRequest,
                $user,
                $workflowService,
                $attachment,
                &$storedPath
            ) {
                $document = Document::create([
                    'tracking_number' => $this->generateTrackingNumber(),
                    'document_type' => $validated['document_type'],
                    'subject' => $validated['subject'],
                    'description' => $validated['description'] ?? null,
                    'requested_delivery_date' => $isPurchaseRequest
                        ? $validated['requested_delivery_date']
                        : null,
                    'originating_office_id' =>
                        $validated['originating_office_id']
                        ?? $user->office_id,
                    'submitted_by' => $user->id,
                    'status' => $shouldSubmit ? 'submitted' : 'draft',
                    'submitted_at' => $shouldSubmit ? now() : null,
                    'template_data' => $isPurchaseRequest
                        ? [
                            'purpose' => $validated['purpose'] ?? null,
                        ]
                        : null,
                ]);

                if ($isPurchaseRequest) {
                    foreach ($validated['items'] as $index => $item) {
                        $quantity = (float) $item['quantity'];
                        $unitPrice = (float) $item['unit_price'];

                        PurchaseRequestItem::create([
                            'document_id' => $document->id,
                            'item_number' => $index + 1,
                            'description' => $item['description'],
                            'quantity' => $quantity,
                            'unit' => $item['unit'],
                            'unit_price' => $unitPrice,
                            'amount' => round($quantity * $unitPrice, 2),
                        ]);
                    }
                }

                if ($attachment) {
                    $storedPath = $attachment->store(
                        "documents/{$document->id}",
                        'local'
                    );

                    if (! $storedPath) {
                        throw new \RuntimeException(
                            'The uploaded file could not be stored.'
                        );
                    }

                    DocumentAttachment::create([
                        'document_id' => $document->id,
                        'original_name' => $attachment->getClientOriginalName(),
                        'file_path' => $storedPath,
                        'disk' => 'local',
                        'mime_type' => $attachment->getMimeType(),
                        'file_size' => $attachment->getSize() ?? 0,
                        'uploaded_by' => $user->id,
                    ]);
                }

                if ($shouldSubmit) {
                    $workflowService->start(
                        $document->document_type,
                        $document->id
                    );
                }

                return $document;
            });
        } catch (Throwable $exception) {
            if ($storedPath !== null) {
                Storage::disk('local')->delete($storedPath);
            }

            throw $exception;
        }

        return redirect()
            ->route('admin.documents.index')
            ->with(
                'success',
                $shouldSubmit
                    ? "Document {$document->tracking_number} submitted successfully."
                    : "Document {$document->tracking_number} saved as draft."
            );
    }

    private function generateTrackingNumber(): string
    {
        do {
            $trackingNumber = 'EDTS-'
                . now()->format('Ymd')
                . '-'
                . Str::upper(Str::random(6));
        } while (
            Document::withTrashed()
                ->where('tracking_number', $trackingNumber)
                ->exists()
        );

        return $trackingNumber;
    }

    public function submitDraft(
        Request $request,
        Document $document,
        DocumentWorkflowService $workflowService
    ): RedirectResponse {
        abort_unless(
            $document->status === 'draft',
            422,
            'Only draft documents can be submitted.'
        );

        $user = $request->user();

        abort_unless(
            $user && $user->is_active,
            403,
            'Your account is not authorized to submit documents.'
        );

        DB::transaction(function () use ($document, $workflowService) {
            $lockedDocument = Document::query()
                ->whereKey($document->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedDocument->status !== 'draft') {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'document' => 'This document is no longer a draft.',
                ]);
            }

            $workflowService->start(
                $lockedDocument->document_type,
                $lockedDocument->id
            );

            $lockedDocument->update([
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);
        });

        return redirect()
            ->route('admin.documents.index')
            ->with(
                'success',
                "Document {$document->tracking_number} submitted successfully."
            );
    }


    public function update(Request $request, Document $document): RedirectResponse
    {
        abort_unless(
            $document->status === 'draft',
            422,
            'Only draft documents can be edited.'
        );

        $user = $request->user();

        abort_unless(
            $user && $user->is_active,
            403,
            'Your account is not authorized to edit documents.'
        );

        $validated = $request->validate([
            'document_type' => [
                'required',
                'string',
                'max:100',
                Rule::exists('document_types', 'code')
                    ->where('is_active', true),
            ],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'originating_office_id' => [
                'nullable',
                'integer',
                'exists:offices,id',
            ],
            'purpose' => [
                'required_if:document_type,purchase_request',
                'nullable',
                'string',
                'max:10000',
            ],
            'requested_delivery_date' => [
                'nullable',
                'date',
                'after_or_equal:today',
            ],
            'items' => [
                'required_if:document_type,purchase_request',
                'array',
                'min:1',
            ],
            'items.*.description' => [
                'required_with:items',
                'string',
                'max:2000',
            ],
            'items.*.quantity' => [
                'required_with:items',
                'numeric',
                'gt:0',
                'max:9999999999',
            ],
            'items.*.unit' => [
                'required_with:items',
                'string',
                'max:50',
            ],
            'items.*.unit_price' => [
                'required_with:items',
                'numeric',
                'min:0',
                'max:9999999999999.99',
            ],
            'attachment' => [
                'nullable',
                File::types([
                    'pdf',
                    'doc',
                    'docx',
                    'jpg',
                    'jpeg',
                    'png',
                ])->max(20 * 1024),
            ],
        ]);

        $documentType = DocumentType::query()
            ->where('code', $validated['document_type'])
            ->where('is_active', true)
            ->firstOrFail();

        $attachment = $request->file('attachment');

        if ($attachment && ! $documentType->allows_upload) {
            return back()->withErrors([
                'attachment' => 'File uploads are not allowed for this document type.',
            ]);
        }

        $isPurchaseRequest =
            $documentType->code === 'purchase_request';

        $storedPath = null;

        try {
            DB::transaction(function () use (
                $document,
                $validated,
                $user,
                $attachment,
                $isPurchaseRequest,
                &$storedPath
            ) {
                $lockedDocument = Document::query()
                    ->whereKey($document->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($lockedDocument->status !== 'draft') {
                    abort(422, 'Only draft documents can be edited.');
                }

                $lockedDocument->update([
                    'document_type' => $validated['document_type'],
                    'subject' => $validated['subject'],
                    'description' => $validated['description'] ?? null,
                    'originating_office_id' =>
                        $validated['originating_office_id']
                        ?? $user->office_id,
                    'requested_delivery_date' => $isPurchaseRequest
                        ? ($validated['requested_delivery_date'] ?? null)
                        : null,
                    'template_data' => $isPurchaseRequest
                        ? [
                            'purpose' => $validated['purpose'] ?? null,
                        ]
                        : null,
                ]);

                // Replace purchase request items with the edited list.
                $lockedDocument->purchaseRequestItems()->delete();

                if ($isPurchaseRequest) {
                    foreach ($validated['items'] as $index => $item) {
                        $quantity = (float) $item['quantity'];
                        $unitPrice = (float) $item['unit_price'];

                        PurchaseRequestItem::create([
                            'document_id' => $lockedDocument->id,
                            'item_number' => $index + 1,
                            'description' => $item['description'],
                            'quantity' => $quantity,
                            'unit' => $item['unit'],
                            'unit_price' => $unitPrice,
                            'amount' => round(
                                $quantity * $unitPrice,
                                2
                            ),
                        ]);
                    }
                }

                // Preserve existing attachments; add the new one if provided.
                if ($attachment) {
                    $storedPath = $attachment->store(
                        "documents/{$lockedDocument->id}",
                        'local'
                    );

                    if (! $storedPath) {
                        throw new \RuntimeException(
                            'The uploaded file could not be stored.'
                        );
                    }

                    DocumentAttachment::create([
                        'document_id' => $lockedDocument->id,
                        'original_name' =>
                            $attachment->getClientOriginalName(),
                        'file_path' => $storedPath,
                        'disk' => 'local',
                        'mime_type' => $attachment->getMimeType(),
                        'file_size' => $attachment->getSize() ?? 0,
                        'uploaded_by' => $user->id,
                    ]);
                }
            });
        } catch (Throwable $exception) {
            if ($storedPath !== null) {
                Storage::disk('local')->delete($storedPath);
            }

            throw $exception;
        }

        return redirect()
            ->route('admin.documents.index')
            ->with('success', 'Draft document updated successfully.');
    }

    public function destroy(
        Request $request,
        Document $document
    ): RedirectResponse {
        abort_unless(
            $document->status === 'draft',
            422,
            'Only draft documents can be deleted.'
        );

        $user = $request->user();

        abort_unless(
            $user && $user->is_active,
            403,
            'Your account is not authorized to delete documents.'
        );

        DB::transaction(function () use ($document) {
            $lockedDocument = Document::query()
                ->whereKey($document->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedDocument->status !== 'draft') {
                abort(422, 'Only draft documents can be deleted.');
            }

            // SoftDeletes sets deleted_at; the database record and files remain.
            $lockedDocument->delete();
        });

        return redirect()
            ->route('admin.documents.index')
            ->with('success', 'Draft document moved to deleted records.');
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PendingApprovalController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless($user && $user->is_active, 403);

        $assignments = DocumentWorkflow::query()
            ->where('document_workflows.status', 'in_progress')
            ->whereHas('currentVersionStep', function ($stepQuery) use ($user) {
                $stepQuery
                    ->whereIn('step_type', ['approval', 'review'])
                    ->where(function ($assignmentQuery) use ($user) {
                        $assignmentQuery->where('approver_id', $user->id);

                        if ($user->office_id !== null) {
                            $assignmentQuery->orWhere(
                                'office_id',
                                $user->office_id
                            );
                        }
                    });
            })
            ->with([
                'currentVersionStep.office:id,name',
                'currentVersionStep.approver:id,name',
                'workflowVersion.workflow:id,name,code',
            ])
            ->orderBy('document_workflows.started_at')
            ->paginate(15)
            ->withQueryString();

        $assignmentRows = $assignments->getCollection();

        $documentIds = $assignmentRows
            ->pluck('document_id')
            ->unique()
            ->values();

        $documentTypes = $assignmentRows
            ->pluck('document_type')
            ->unique()
            ->values();

        $documents = Document::query()
            ->whereIn('id', $documentIds)
            ->whereIn('document_type', $documentTypes)
            ->with([
                'originatingOffice:id,name',
                'submitter:id,name',
                'purchaseRequestItems',
                'fundingSourceAssigner:id,name',
            ])
            ->get()
            ->keyBy(fn (Document $document) =>
                $document->document_type . ':' . $document->id
            );

        $resolvedDocuments = $assignmentRows
            ->map(function (DocumentWorkflow $assignment) use ($documents) {
                $key = $assignment->document_type . ':' . $assignment->document_id;

                return [
                    'assignment_id' => $assignment->id,
                    'document' => $documents->get($key),
                ];
            })
            ->filter(fn (array $row) => $row['document'] !== null);

        $resolvedDocumentIds = $resolvedDocuments
            ->pluck('document.id')
            ->unique()
            ->values();

        $workflowIds = $assignmentRows
            ->pluck('id')
            ->unique()
            ->values();

        // Load attachments without exposing internal storage paths.
        $attachmentsByDocument = DB::table('document_attachments')
            ->whereIn('document_id', $resolvedDocumentIds)
            ->orderBy('created_at')
            ->get([
                'id',
                'document_id',
                'original_name',
                'mime_type',
                'file_size',
                'uploaded_by',
                'created_at',
            ])
            ->groupBy('document_id');

        // Load recorded actions for each workflow instance.
        $historyByWorkflow = DB::table('workflow_actions')
            ->leftJoin('users', 'users.id', '=', 'workflow_actions.user_id')
            ->whereIn('workflow_actions.document_workflow_id', $workflowIds)
            ->orderBy('workflow_actions.acted_at')
            ->get([
                'workflow_actions.id',
                'workflow_actions.document_workflow_id',
                'workflow_actions.action',
                'workflow_actions.comments',
                'workflow_actions.acted_at',
                'users.name as user_name',
            ])
            ->groupBy('document_workflow_id');

        $assignments->getCollection()->transform(
            function (DocumentWorkflow $assignment) use (
                $documents,
                $attachmentsByDocument,
                $historyByWorkflow
            ) {
                $key = $assignment->document_type . ':' . $assignment->document_id;
                $document = $documents->get($key);

                $templateData = $document?->template_data;

                if (is_string($templateData)) {
                    $decoded = json_decode($templateData, true);
                    $templateData = is_array($decoded) ? $decoded : [];
                }

                if (! is_array($templateData)) {
                    $templateData = [];
                }

                $items = $document?->purchaseRequestItems
                    ?->map(fn ($item) => [
                        'id' => $item->id,
                        'item_number' => $item->item_number,
                        'description' => $item->description,
                        'quantity' => $item->quantity,
                        'unit' => $item->unit,
                        'unit_price' => $item->unit_price,
                        'amount' => $item->amount,
                    ])
                    ->values()
                    ->all() ?? [];

                $attachments = $document
                    ? ($attachmentsByDocument->get($document->id) ?? collect())
                        ->map(fn ($attachment) => [
                            'id' => $attachment->id,
                            'original_name' => $attachment->original_name,
                            'mime_type' => $attachment->mime_type,
                            'file_size' => $attachment->file_size,
                            'uploaded_by' => $attachment->uploaded_by,
                            'created_at' => $attachment->created_at,
                        ])
                        ->values()
                        ->all()
                    : [];

                $history = ($historyByWorkflow->get($assignment->id) ?? collect())
                    ->map(fn ($action) => [
                        'id' => $action->id,
                        'action' => $action->action,
                        'comments' => $action->comments,
                        'acted_at' => $action->acted_at,
                        'user' => $action->user_name,
                    ])
                    ->values()
                    ->all();

                return [
                    'id' => $assignment->id,
                    'status' => $assignment->status,
                    'started_at' => $assignment->started_at,
                    'workflow_version_id' => $assignment->workflow_version_id,

                    'workflow' => [
                        'id' => $assignment->workflowVersion?->workflow?->id,
                        'name' => $assignment->workflowVersion?->workflow?->name,
                        'code' => $assignment->workflowVersion?->workflow?->code,
                        'version' => $assignment->workflowVersion?->version,
                    ],

                    'current_step' => [
                        'id' => $assignment->currentVersionStep?->id,
                        'office_id' => $assignment->currentVersionStep?->office_id,
                        'name' => $assignment->currentVersionStep?->name,
                        'position' => $assignment->currentVersionStep?->position,
                        'step_type' => $assignment->currentVersionStep?->step_type,
                        'office' => $assignment->currentVersionStep?->office?->name,
                        'approver' => $assignment->currentVersionStep?->approver?->name,
                    ],

                    'document' => $document ? [
                        'id' => $document->id,
                        'tracking_number' => $document->tracking_number,
                        'document_type' => $document->document_type,
                        'subject' => $document->subject,
                        'description' => $document->description,
                        'status' => $document->status,
                        'originating_office' => $document->originatingOffice?->name,
                        'submitter' => $document->submitter?->name,
                        'submitted_at' => $document->submitted_at,
                        'created_at' => $document->created_at,
                        'template_data' => $templateData,
                        'purchase_request_items' => $items,
                        'attachments' => $attachments,

                        // Purchase Request budget review and audit fields.
                        'funding_source' => $document->funding_source,
                        'requested_delivery_date' => $document->requested_delivery_date,
                        'budget_availability' => $document->budget_availability,
                        'budget_remarks' => $document->budget_remarks,
                        'funding_source_assigned_by' => $document->funding_source_assigned_by,
                        'funding_source_assigned_at' => $document->funding_source_assigned_at,
                        'funding_source_assigner' => $document->fundingSourceAssigner?->name,
                    ] : null,

                    'history' => $history,
                ];
            }
        );

        return Inertia::render('admin/pending-approvals/index', [
            'assignments' => $assignments,
        ]);
    }
}

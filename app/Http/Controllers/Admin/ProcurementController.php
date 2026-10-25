<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Procurement;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProcurementController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $purchaseRequests = Document::query()
            ->with([
                'originatingOffice:id,name',
                'submitter:id,name',
                'purchaseRequestItems',
                'procurement:id,document_id,status,opened_at',
            ])
            ->where('document_type', 'purchase_request')
            ->where('status', 'completed')
            ->whereHas('workflowAssignments', function (Builder $query): void {
                $query->where('status', 'completed');
            })
            ->withSum('purchaseRequestItems as requested_total', 'amount')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $subQuery) use ($search): void {
                    $subQuery
                        ->where('tracking_number', 'like', "%{$search}%")
                        ->orWhere('subject', 'like', "%{$search}%")
                        ->orWhereHas('originatingOffice', function (Builder $officeQuery) use ($search): void {
                            $officeQuery->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderByDesc('completed_at')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/procurement/index', [
            'purchaseRequests' => $purchaseRequests,
            'filters' => ['search' => $search],
        ]);
    }

    public function start(Document $document): RedirectResponse
    {
        abort_unless(
            $document->document_type === 'purchase_request'
                && $document->status === 'completed'
                && $document->workflowAssignments()->where('status', 'completed')->exists(),
            422,
            'Procurement can only be opened for a fully approved Purchase Request.'
        );

        $procurement = DB::transaction(function () use ($document): Procurement {
            return Procurement::query()->firstOrCreate(
                ['document_id' => $document->id],
                [
                    'status' => 'canvassing',
                    'opened_by' => auth()->id(),
                    'opened_at' => now(),
                ]
            );
        });

        return redirect()
            ->route('admin.procurement.show', $procurement)
            ->with(
                'success',
                $procurement->wasRecentlyCreated
                    ? 'Procurement opened. You can now record supplier quotations.'
                    : 'Procurement already exists for this Purchase Request.'
            );
    }

    public function show(Procurement $procurement): Response
    {
        $procurement->load([
            'document.originatingOffice:id,name',
            'document.submitter:id,name',
            'document.purchaseRequestItems',
            'opener:id,name',
            'quotations.supplier:id,name,contact_person,email,phone',
            'quotations.items.purchaseRequestItem:id,item_number,description,quantity,unit',
            'quotations.submitter:id,name',
        ]);

        $suppliers = \App\Models\Supplier::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'contact_person', 'email', 'phone']);

        return Inertia::render('admin/procurement/show', [
            'procurement' => $procurement,
            'suppliers' => $suppliers,
        ]);
    }
}

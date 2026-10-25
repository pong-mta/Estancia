<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentWorkflow;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', '');

        $query = Document::query()
            ->with([
                'originatingOffice:id,name',
                'submitter:id,name',
            ])
            ->withCount('workflowActions')
            ->whereHas('workflowAssignments.actions');

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('tracking_number', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('document_type', 'like', "%{$search}%");
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        $documents = $query
            ->orderByDesc('updated_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/document-history/index', [
            'documents' => $documents,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function show(Document $document): Response
    {
        $document->load([
            'originatingOffice:id,name',
            'submitter:id,name',
            'workflowAssignments.workflowVersion.workflow',
            'workflowAssignments.currentVersionStep.office:id,name',
            'workflowAssignments.currentVersionStep.approver:id,name',
            'workflowAssignments.workflowVersion.steps.office:id,name',
            'workflowAssignments.workflowVersion.steps.approver:id,name',
            'workflowAssignments.actions.user:id,name',
            'workflowAssignments.actions.workflowVersionStep.office:id,name',
            'workflowAssignments.actions.workflowVersionStep.approver:id,name',
        ]);

        return Inertia::render('admin/document-history/show', [
            'document' => $document,
        ]);
    }
}

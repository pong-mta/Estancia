<?php

namespace App\Services;

use App\Models\DocumentWorkflow;
use App\Models\Workflow;
use App\Models\WorkflowVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DocumentWorkflowService
{
    /**
     * Start processing a document using the latest published workflow version.
     *
     * The document is assigned to immutable version steps, not editable
     * workflow steps. Existing document workflow assignments are not changed.
     */
    public function start(
        string $documentType,
        int $documentId
    ): DocumentWorkflow {
        return DB::transaction(function () use (
            $documentType,
            $documentId
        ) {
            $workflow = Workflow::query()
                ->where('document_type', $documentType)
                ->where('status', 'published')
                ->orderByDesc('version')
                ->lockForUpdate()
                ->first();

            if (! $workflow) {
                throw ValidationException::withMessages([
                    'workflow' => 'No published workflow is available for this document type.',
                ]);
            }

            $version = WorkflowVersion::query()
                ->where('workflow_id', $workflow->id)
                ->where('version', $workflow->version)
                ->where('status', 'published')
                ->with('steps')
                ->first();

            if (! $version) {
                throw ValidationException::withMessages([
                    'workflow' => 'The latest published workflow version could not be found.',
                ]);
            }

            $steps = $version->steps->sortBy('position')->values();

            if ($steps->isEmpty()) {
                throw ValidationException::withMessages([
                    'workflow' => 'The published workflow version has no immutable steps.',
                ]);
            }

            /*
             * Avoid starting the same document twice for the same document
             * type. This is an application-level check; if concurrent requests
             * are possible, add a suitable database uniqueness strategy later.
             */
            $existing = DocumentWorkflow::query()
                ->where('document_type', $documentType)
                ->where('document_id', $documentId)
                ->whereIn('status', ['in_progress', 'pending'])
                ->lockForUpdate()
                ->first();

            if ($existing) {
                throw ValidationException::withMessages([
                    'document' => 'This document already has an active workflow.',
                ]);
            }

            $firstStep = $steps->first();

            $assignment = DocumentWorkflow::create([
                'document_type' => $documentType,
                'document_id' => $documentId,
                'workflow_version_id' => $version->id,

                // Keep the legacy pointer for compatibility.
                'current_step_id' => $firstStep->original_step_id,

                // Use the immutable step for actual execution.
                'current_version_step_id' => $firstStep->id,

                'status' => 'in_progress',
                'started_at' => now(),
            ]);

            return $assignment->load([
                'workflowVersion',
                'currentVersionStep',
            ]);
        });
    }
}

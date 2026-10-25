<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentWorkflow;
use App\Models\User;
use App\Models\WorkflowAction;
use App\Models\WorkflowVersionStep;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WorkflowActionController extends Controller
{
    private const BUDGET_OFFICE_ID = 4;

    /** Approve the current workflow step. */
    public function approve(
        Request $request,
        DocumentWorkflow $documentWorkflow
    ): RedirectResponse {
        return $this->processAction($request, $documentWorkflow, 'approved');
    }

    /** Reject the document at the current workflow step. */
    public function reject(
        Request $request,
        DocumentWorkflow $documentWorkflow
    ): RedirectResponse {
        return $this->processAction($request, $documentWorkflow, 'rejected');
    }

    /**
     * Save a Purchase Request budget assessment without advancing
     * or rejecting the workflow.
     */
    public function saveBudgetReview(
        Request $request,
        DocumentWorkflow $documentWorkflow
    ): RedirectResponse {
        $user = $request->user();

        abort_unless(
            $user instanceof User && $user->is_active,
            403,
            'Your account is not authorized to review this budget.'
        );

        $data = $request->validate([
            'funding_source' => ['required', 'string', 'max:150'],
            'budget_availability' => [
                'required',
                'in:available,unavailable,requires_correction',
            ],
            'budget_amount' => ['required', 'numeric', 'min:0.01'],
            'budget_remarks' => ['nullable', 'string', 'max:5000'],
        ]);

        DB::transaction(function () use ($documentWorkflow, $user, $data) {
            $assignment = DocumentWorkflow::query()
                ->whereKey($documentWorkflow->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($assignment->status !== 'in_progress') {
                throw ValidationException::withMessages([
                    'workflow' => 'This document workflow is not in progress.',
                ]);
            }

            if ($assignment->document_type !== 'purchase_request') {
                throw ValidationException::withMessages([
                    'workflow' => 'Budget review is only available for Purchase Requests.',
                ]);
            }

            $step = WorkflowVersionStep::query()
                ->whereKey($assignment->current_version_step_id)
                ->lockForUpdate()
                ->first();

            if (! $step) {
                throw ValidationException::withMessages([
                    'workflow' => 'The current workflow step could not be found.',
                ]);
            }

            if ((int) $step->workflow_version_id !== (int) $assignment->workflow_version_id) {
                throw ValidationException::withMessages([
                    'workflow' => 'The current step does not belong to the assigned workflow version.',
                ]);
            }

            if ((int) $step->office_id !== self::BUDGET_OFFICE_ID) {
                abort(403, 'Only the Budget Office can record this assessment.');
            }

            if (! in_array($step->step_type, ['approval', 'review'], true)) {
                throw ValidationException::withMessages([
                    'workflow' => 'This step does not support budget review.',
                ]);
            }

            $hasApproverRole = $user->hasSystemRole(['admin', 'approver']);
            $isAssignedApprover = (int) $step->approver_id === (int) $user->id;
            $isOfficeMember = $step->office_id !== null
                && (int) $user->office_id === (int) $step->office_id;

            if (! $hasApproverRole || (! $isAssignedApprover && ! $isOfficeMember)) {
                abort(403, 'You are not authorized to record this assessment.');
            }

            $document = Document::query()
                ->whereKey($assignment->document_id)
                ->where('document_type', 'purchase_request')
                ->lockForUpdate()
                ->first();

            if (! $document) {
                throw ValidationException::withMessages([
                    'workflow' => 'The Purchase Request document could not be found.',
                ]);
            }

            $requestedTotal = (float) DB::table('purchase_request_items')
                ->where('document_id', $document->id)
                ->sum('amount');

            if (
                $data['budget_availability'] === 'available'
                && (float) $data['budget_amount'] < $requestedTotal
            ) {
                throw ValidationException::withMessages([
                    'budget_amount' => sprintf(
                        'The budget must cover the total requested amount of %.2f, or availability must be marked Unavailable or Requires Correction.',
                        $requestedTotal
                    ),
                ]);
            }

            $hasFinalAction = WorkflowAction::query()
                ->where('document_workflow_id', $assignment->id)
                ->where('workflow_version_step_id', $step->id)
                ->whereIn('action', ['approved', 'rejected'])
                ->exists();

            if ($hasFinalAction) {
                throw ValidationException::withMessages([
                    'workflow' => 'A final action has already been recorded for this step.',
                ]);
            }

            $recordedAt = now();

            $document->update([
                'funding_source' => trim($data['funding_source']),
                'budget_availability' => $data['budget_availability'],
                'budget_amount' => $data['budget_amount'],
                'budget_remarks' => $data['budget_remarks'] ?? null,
                'funding_source_assigned_by' => $user->id,
                'funding_source_assigned_at' => $recordedAt,
            ]);

            WorkflowAction::create([
                'document_workflow_id' => $assignment->id,
                'workflow_step_id' => $step->original_step_id,
                'workflow_version_step_id' => $step->id,
                'user_id' => $user->id,
                'action' => 'budget_reviewed',
                'comments' => $data['budget_remarks'] ?? null,
                'metadata' => [
                    'workflow_version_id' => $assignment->workflow_version_id,
                    'workflow_version_step_id' => $step->id,
                    'budget_review' => [
                        'funding_source' => trim($data['funding_source']),
                        'budget_availability' => $data['budget_availability'],
                        'budget_amount' => (float) $data['budget_amount'],
                        'budget_remarks' => $data['budget_remarks'] ?? null,
                        'requested_total' => $requestedTotal,
                        'recorded_by' => $user->id,
                    ],
                ],
                'acted_at' => $recordedAt,
            ]);
        });

        return back()->with(
            'success',
            'Budget assessment saved. The Purchase Request remains at the Budget Office step.'
        );
    }

    private function processAction(
        Request $request,
        DocumentWorkflow $documentWorkflow,
        string $action
    ): RedirectResponse {
        $user = $request->user();

        abort_unless(
            $user instanceof User && $user->is_active,
            403,
            'Your account is not authorized to perform workflow actions.'
        );

        $data = $request->validate([
            'comments' => [
                $action === 'rejected' ? 'required' : 'nullable',
                'string',
                'max:5000',
            ],
            'funding_source' => ['sometimes', 'nullable', 'string', 'max:150'],
            'budget_availability' => [
                'sometimes',
                'nullable',
                'in:available,unavailable,requires_correction',
            ],
            'budget_amount' => ['sometimes', 'nullable', 'numeric', 'min:0.01'],
            'budget_remarks' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        DB::transaction(function () use (
            $documentWorkflow,
            $user,
            $action,
            $data
        ) {
            $assignment = DocumentWorkflow::query()
                ->whereKey($documentWorkflow->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($assignment->status !== 'in_progress') {
                throw ValidationException::withMessages([
                    'workflow' => 'This document workflow is not in progress.',
                ]);
            }

            $step = WorkflowVersionStep::query()
                ->whereKey($assignment->current_version_step_id)
                ->lockForUpdate()
                ->first();

            if (! $step) {
                throw ValidationException::withMessages([
                    'workflow' => 'The current workflow step could not be found.',
                ]);
            }

            if ((int) $step->workflow_version_id !== (int) $assignment->workflow_version_id) {
                throw ValidationException::withMessages([
                    'workflow' => 'The current step does not belong to the assigned workflow version.',
                ]);
            }

            $hasApproverRole = $user->hasSystemRole(['admin', 'approver']);
            $isAssignedApprover = (int) $step->approver_id === (int) $user->id;
            $isOfficeMember = $step->office_id !== null
                && (int) $user->office_id === (int) $step->office_id;

            if (! $hasApproverRole || (! $isAssignedApprover && ! $isOfficeMember)) {
                abort(403, 'You are not authorized to act on this workflow step.');
            }

            if (! in_array($step->step_type, ['approval', 'review'], true)) {
                throw ValidationException::withMessages([
                    'workflow' => 'This step does not support approval or rejection actions.',
                ]);
            }

            $isBudgetReview = $assignment->document_type === 'purchase_request'
                && (int) $step->office_id === self::BUDGET_OFFICE_ID;

            $document = null;

            if ($isBudgetReview) {
                $document = Document::query()
                    ->whereKey($assignment->document_id)
                    ->where('document_type', 'purchase_request')
                    ->lockForUpdate()
                    ->first();

                if (! $document) {
                    throw ValidationException::withMessages([
                        'workflow' => 'The Purchase Request document could not be found.',
                    ]);
                }
            }

            if ($isBudgetReview && $action === 'approved') {
                $fundingSource = trim((string) (
                    $data['funding_source'] ?? $document->funding_source ?? ''
                ));

                $budgetAvailability = $data['budget_availability']
                    ?? $document->budget_availability;

                $budgetAmount = $data['budget_amount']
                    ?? $document->budget_amount;

                $requestedTotal = (float) DB::table('purchase_request_items')
                    ->where('document_id', $document->id)
                    ->sum('amount');

                $errors = [];

                if ($fundingSource === '') {
                    $errors['funding_source'] =
                        'Enter a funding source before approving this Purchase Request.';
                }

                if ($budgetAvailability !== 'available') {
                    $errors['budget_availability'] =
                        'Budget availability must be Available before approval.';
                }

                if (
                    $budgetAmount === null
                    || $budgetAmount === ''
                    || ! is_numeric($budgetAmount)
                    || (float) $budgetAmount <= 0
                ) {
                    $errors['budget_amount'] =
                        'Enter a budget amount greater than zero before approval.';
                } elseif ((float) $budgetAmount < $requestedTotal) {
                    $errors['budget_amount'] = sprintf(
                        'The budget amount (%.2f) must cover the total requested amount (%.2f).',
                        (float) $budgetAmount,
                        $requestedTotal
                    );
                }

                if ($errors !== []) {
                    throw ValidationException::withMessages($errors);
                }

                // Store the effective values for the approval and audit record.
                $data['funding_source'] = $fundingSource;
                $data['budget_availability'] = $budgetAvailability;
                $data['budget_amount'] = (float) $budgetAmount;
                $data['requested_total'] = $requestedTotal;
            }

            $alreadyActed = WorkflowAction::query()
                ->where('document_workflow_id', $assignment->id)
                ->where('workflow_version_step_id', $step->id)
                ->whereIn('action', ['approved', 'rejected'])
                ->exists();

            if ($alreadyActed) {
                throw ValidationException::withMessages([
                    'workflow' => 'A final action has already been recorded for this step.',
                ]);
            }

            if ($isBudgetReview) {
                $budgetUpdates = [];

                if (array_key_exists('budget_availability', $data)) {
                    $budgetUpdates['budget_availability'] = $data['budget_availability'];
                }

                if (array_key_exists('budget_amount', $data) && $data['budget_amount'] !== null) {
                    $budgetUpdates['budget_amount'] = $data['budget_amount'];
                }

                if (array_key_exists('budget_remarks', $data)) {
                    $budgetUpdates['budget_remarks'] = $data['budget_remarks'];
                }

                if (filled($data['funding_source'] ?? null)) {
                    $budgetUpdates['funding_source'] = trim($data['funding_source']);
                    $budgetUpdates['funding_source_assigned_by'] = $user->id;
                    $budgetUpdates['funding_source_assigned_at'] = now();
                }

                if ($budgetUpdates !== []) {
                    $document->update($budgetUpdates);
                }
            }

            WorkflowAction::create([
                'document_workflow_id' => $assignment->id,
                'workflow_step_id' => $step->original_step_id,
                'workflow_version_step_id' => $step->id,
                'user_id' => $user->id,
                'action' => $action,
                'comments' => $data['comments'] ?? null,
                'metadata' => array_filter([
                    'workflow_version_id' => $assignment->workflow_version_id,
                    'workflow_version_step_id' => $step->id,
                    'budget_review' => $isBudgetReview ? [
                        'funding_source' => $data['funding_source']
                            ?? $document?->funding_source,
                        'budget_availability' => $data['budget_availability']
                            ?? $document?->budget_availability,
                        'budget_amount' => $data['budget_amount']
                            ?? $document?->budget_amount,
                        'budget_remarks' => $data['budget_remarks']
                            ?? $document?->budget_remarks,
                        'requested_total' => $data['requested_total'] ?? null,
                        'recorded_by' => $user->id,
                    ] : null,
                ], fn ($value) => $value !== null),
                'acted_at' => now(),
            ]);

            if ($action === 'rejected') {
                $completedAt = now();

                $assignment->update([
                    'status' => 'rejected',
                    'completed_at' => $completedAt,
                ]);

                Document::query()
                    ->whereKey($assignment->document_id)
                    ->where('document_type', $assignment->document_type)
                    ->update([
                        'status' => 'rejected',
                        'completed_at' => $completedAt,
                    ]);

                return;
            }

            $nextStep = WorkflowVersionStep::query()
                ->where('workflow_version_id', $assignment->workflow_version_id)
                ->where('position', '>', $step->position)
                ->orderBy('position')
                ->first();

            if ($nextStep) {
                $assignment->update([
                    'current_version_step_id' => $nextStep->id,
                    'current_step_id' => $nextStep->original_step_id,
                ]);
            } else {
                $completedAt = now();

                $assignment->update([
                    'status' => 'completed',
                    'completed_at' => $completedAt,
                    'current_version_step_id' => null,
                    'current_step_id' => null,
                ]);

                Document::query()
                    ->whereKey($assignment->document_id)
                    ->where('document_type', $assignment->document_type)
                    ->update([
                        'status' => 'completed',
                        'completed_at' => $completedAt,
                    ]);
            }
        });

        return back()->with(
            'success',
            $action === 'approved'
                ? 'Workflow step approved successfully.'
                : 'Document workflow rejected.'
        );
    }
}

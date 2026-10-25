<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Office;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowStepController extends Controller
{
    private function authorizeAdmin(): User
    {
        $user = auth()->user();

        abort_unless(
            $user instanceof User
                && $user->hasSystemRole('admin')
                && $user->is_active,
            403,
            'You are not authorized to manage workflow steps.'
        );

        return $user;
    }

    private function ensureDraft(Workflow $workflow): void
    {
        abort_unless(
            $workflow->status === 'draft',
            403,
            'Only draft workflows can be modified.'
        );
    }

    public function index(Workflow $workflow): Response
    {
        $this->authorizeAdmin();

        return Inertia::render('admin/workflows/steps', [
            'workflow' => [
                'id' => $workflow->id,
                'name' => $workflow->name,
                'code' => $workflow->code,
                'document_type' => $workflow->document_type,
                'status' => $workflow->status,
                'version' => $workflow->version,
            ],
            'steps' => $workflow->steps()
                ->with([
                    'office:id,code,name',
                    'approver:id,name,email',
                ])
                ->get()
                ->map(fn (WorkflowStep $step) => [
                    'id' => $step->id,
                    'name' => $step->name,
                    'step_type' => $step->step_type,
                    'position' => $step->position,
                    'office' => $step->office ? [
                        'id' => $step->office->id,
                        'code' => $step->office->code,
                        'name' => $step->office->name,
                    ] : null,
                    'approver' => $step->approver ? [
                        'id' => $step->approver->id,
                        'name' => $step->approver->name,
                        'email' => $step->approver->email,
                    ] : null,
                    'settings' => $step->settings,
                ]),
            'offices' => Office::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
            'approvers' => User::query()
                ->where('is_active', true)
                ->whereIn('system_role', ['admin', 'approver'])
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'office_id']),
            'stepTypes' => [
                ['value' => 'approval', 'label' => 'Approval'],
                ['value' => 'review', 'label' => 'Review'],
                ['value' => 'submission', 'label' => 'Submission'],
                ['value' => 'notification', 'label' => 'Notification'],
            ],
        ]);
    }

    public function store(Request $request, Workflow $workflow): RedirectResponse
    {
        $this->authorizeAdmin();
        $this->ensureDraft($workflow);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'step_type' => [
                'required',
                Rule::in(['approval', 'review', 'submission', 'notification']),
            ],
            'office_id' => [
                'nullable',
                'integer',
                Rule::exists('offices', 'id')->where('is_active', true),
            ],
            'approver_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('is_active', true),
            ],
            'settings' => ['nullable', 'array'],
        ]);

        DB::transaction(function () use ($workflow, $data) {
            $position = ((int) $workflow->steps()->max('position')) + 1;

            $workflow->steps()->create([
                'name' => $data['name'],
                'step_type' => $data['step_type'],
                'position' => $position,
                'office_id' => $data['office_id'] ?? null,
                'approver_id' => $data['approver_id'] ?? null,
                'settings' => $data['settings'] ?? null,
            ]);
        });

        return to_route('admin.workflows.steps.index', $workflow)
            ->with('success', 'Workflow step added successfully.');
    }

    public function update(
        Request $request,
        Workflow $workflow,
        WorkflowStep $step
    ): RedirectResponse {
        $this->authorizeAdmin();
        $this->ensureDraft($workflow);

        abort_unless($step->workflow_id === $workflow->id, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'step_type' => [
                'required',
                Rule::in(['approval', 'review', 'submission', 'notification']),
            ],
            'office_id' => [
                'nullable',
                'integer',
                Rule::exists('offices', 'id')->where('is_active', true),
            ],
            'approver_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where('is_active', true),
            ],
            'settings' => ['nullable', 'array'],
        ]);

        $step->update([
            'name' => $data['name'],
            'step_type' => $data['step_type'],
            'office_id' => $data['office_id'] ?? null,
            'approver_id' => $data['approver_id'] ?? null,
            'settings' => $data['settings'] ?? null,
        ]);

        return to_route('admin.workflows.steps.index', $workflow)
            ->with('success', 'Workflow step updated successfully.');
    }

    
    public function reorder(Request $request, Workflow $workflow): RedirectResponse
    {
        $this->authorizeAdmin();
        $this->ensureDraft($workflow);

        $data = $request->validate([
            'step_ids' => ['required', 'array', 'min:1'],
            'step_ids.*' => ['required', 'integer', 'distinct'],
        ]);

        $existingIds = $workflow->steps()
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->sort()
            ->values()
            ->all();

        $submittedIds = collect($data['step_ids'])
            ->map(fn ($id) => (int) $id)
            ->sort()
            ->values()
            ->all();

        if ($existingIds !== $submittedIds) {
            return back()->withErrors([
                'step_ids' => 'The submitted steps do not match this workflow.',
            ]);
        }

        DB::transaction(function () use ($workflow, $data) {
            $steps = $workflow->steps()
                ->orderBy('position')
                ->get();

            // Move all positions out of the normal range first to avoid
            // collisions with the unique workflow_id + position constraint.
            $workflow->steps()->update([
                'position' => DB::raw('position + 1000000'),
            ]);

            // Apply the requested order after positions are safely shifted.
            foreach ($data['step_ids'] as $index => $stepId) {
                $workflow->steps()
                    ->whereKey($stepId)
                    ->update([
                        'position' => $index + 1,
                    ]);
            }
        });

        return to_route('admin.workflows.steps.index', $workflow)
            ->with('success', 'Workflow steps reordered successfully.');
    }

    public function destroy(
        Workflow $workflow,
        WorkflowStep $step
    ): RedirectResponse {
        $this->authorizeAdmin();
        $this->ensureDraft($workflow);

        abort_unless($step->workflow_id === $workflow->id, 404);

        DB::transaction(function () use ($workflow, $step) {
            $step->delete();

            // Temporarily move positions out of the normal range to avoid
            // conflicts with the unique (workflow_id, position) constraint.
            $workflow->steps()->update([
                'position' => DB::raw('position + 1000000'),
            ]);

            $steps = $workflow->steps()
                ->orderBy('position')
                ->get();

            foreach ($steps as $index => $remainingStep) {
                $remainingStep->update([
                    'position' => $index + 1,
                ]);
            }
        });

        return to_route('admin.workflows.steps.index', $workflow)
            ->with('success', 'Workflow step removed successfully.');
    }
}

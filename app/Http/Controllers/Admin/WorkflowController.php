<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use App\Models\User;
use App\Models\Workflow;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowController extends Controller
{
    private const DOCUMENT_TYPES = [
        'purchase_request' => 'Purchase Request',
        'purchase_order' => 'Purchase Order',
        'request_for_quotation' => 'Request for Quotation',
        'abstract_of_bids' => 'Abstract of Bids',
        'inspection_acceptance_report' => 'Inspection and Acceptance Report',
        'travel_order' => 'Travel Order',
        'authority_to_travel' => 'Authority to Travel',
        'leave_application' => 'Leave Application',
        'overtime_request' => 'Overtime Request',
        'certificate_of_attendance' => 'Certificate of Attendance',
        'disbursement_voucher' => 'Disbursement Voucher',
        'obligation_request' => 'Obligation Request',
        'payroll' => 'Payroll',
        'cash_advance' => 'Cash Advance',
        'liquidation_report' => 'Liquidation Report',
        'reimbursement_claim' => 'Reimbursement Claim',
        'incoming_document' => 'Incoming Document',
        'outgoing_document' => 'Outgoing Document',
        'memorandum' => 'Memorandum',
        'office_order' => 'Office Order',
        'special_order' => 'Special Order',
        'endorsement' => 'Endorsement',
        'official_letter' => 'Official Letter',
        'invitation' => 'Invitation',
        'appointment' => 'Appointment',
        'personnel_action' => 'Personnel Action',
        'certificate_of_employment' => 'Certificate of Employment',
        'service_record' => 'Service Record',
        'daily_time_record' => 'Daily Time Record',
        'resolution' => 'Resolution',
        'ordinance' => 'Ordinance',
        'executive_order' => 'Executive Order',
        'contract' => 'Contract',
        'memorandum_of_agreement' => 'Memorandum of Agreement',
        'project_proposal' => 'Project Proposal',
        'accomplishment_report' => 'Accomplishment Report',
        'inspection_report' => 'Inspection Report',
        'certification' => 'Certification',
        'request_for_assistance' => 'Request for Assistance',
        'program_of_work' => 'Program of Work',
        'bill_of_quantities' => 'Bill of Quantities',
        'notice_to_proceed' => 'Notice to Proceed',
        'certificate_of_completion' => 'Certificate of Completion',
        'incident_report' => 'Incident Report',
        'damage_assessment_report' => 'Damage Assessment Report',
        'relief_request' => 'Relief Request',
        'emergency_purchase_request' => 'Emergency Purchase Request',
        'other' => 'Other Document',
    ];

    private function authorizeAdmin(): User
    {
        $user = auth()->user();

        abort_unless(
            $user instanceof User
                && $user->hasSystemRole('admin')
                && $user->is_active,
            403,
            'You are not authorized to manage workflows.'
        );

        return $user;
    }

    public function index(Request $request): Response
    {
        $this->authorizeAdmin();

        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', ''));

        $workflows = Workflow::query()
            ->with('creator:id,name')
            ->withCount('steps')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('document_type', 'like', "%{$search}%");
                });
            })
            ->when(
                in_array($status, ['draft', 'published', 'archived'], true),
                fn ($query) => $query->where('status', $status)
            )
            ->orderByDesc('updated_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Workflow $workflow) => [
                'id' => $workflow->id,
                'name' => $workflow->name,
                'code' => $workflow->code,
                'description' => $workflow->description,
                'document_type' => $workflow->document_type,
                'status' => $workflow->status,
                'version' => $workflow->version,
                'steps_count' => $workflow->steps_count,
                'creator' => $workflow->creator ? [
                    'id' => $workflow->creator->id,
                    'name' => $workflow->creator->name,
                ] : null,
                'created_at' => $workflow->created_at?->toISOString(),
                'updated_at' => $workflow->updated_at?->toISOString(),
            ]);

        return Inertia::render('admin/workflows/index', [
            'workflows' => $workflows,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'documentTypes' => collect(self::DOCUMENT_TYPES)
                ->map(fn (string $label, string $value) => [
                    'value' => $value,
                    'label' => $label,
                ])
                ->values()
                ->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $admin = $this->authorizeAdmin();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => [
                'required',
                'string',
                'max:50',
                'alpha_dash',
                'unique:workflows,code',
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'document_type' => [
                'required',
                'string',
                'max:100',
                Rule::in(array_keys(self::DOCUMENT_TYPES)),
            ],
        ]);

        Workflow::create([
            ...$data,
            'status' => 'draft',
            'version' => 1,
            'created_by' => $admin->id,
        ]);

        return to_route('admin.workflows.index')
            ->with('success', 'Workflow draft created successfully.');
    }

    public function update(Request $request, Workflow $workflow): RedirectResponse
    {
        $this->authorizeAdmin();

        if ($workflow->status !== 'draft') {
            return back()->withErrors([
                'workflow' => 'Only draft workflows can be edited. Create a new version to change a published workflow.',
            ]);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => [
                'required',
                'string',
                'max:50',
                'alpha_dash',
                Rule::unique('workflows', 'code')->ignore($workflow->id),
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'document_type' => [
                'required',
                'string',
                'max:100',
                Rule::in(array_keys(self::DOCUMENT_TYPES)),
            ],
        ]);

        $workflow->update($data);

        return to_route('admin.workflows.index')
            ->with('success', 'Workflow draft updated successfully.');
    }

    public function publish(Workflow $workflow): RedirectResponse
    {
        $admin = $this->authorizeAdmin();

        if ($workflow->status !== 'draft') {
            return back()->withErrors([
                'workflow' => 'Only draft workflows can be published.',
            ]);
        }

        $steps = $workflow->steps()
            ->with(['office:id,code,name', 'approver:id,name,email'])
            ->get();

        if ($steps->isEmpty()) {
            return back()->withErrors([
                'workflow' => 'Add at least one workflow step before publishing.',
            ]);
        }

        if ($steps->contains(
            fn ($step) => in_array($step->step_type, ['approval', 'review'], true)
                && ! $step->office_id
                && ! $step->approver_id
        )) {
            return back()->withErrors([
                'workflow' => 'Every approval or review step must have an office or a specific approver assigned.',
            ]);
        }

        DB::transaction(function () use ($workflow, $steps, $admin) {
            /*
             * Register the document type when the workflow is published.
             *
             * If the type already exists, preserve its current name,
             * description, active status, and upload/template settings.
             */
            DocumentType::firstOrCreate(
                ['code' => $workflow->document_type],
                [
                    'name' => $workflow->name,
                    'description' => $workflow->description,
                    'is_active' => true,
                    'allows_upload' => true,
                    'allows_template' => true,
                ]
            );

            $definition = [
                'name' => $workflow->name,
                'code' => $workflow->code,
                'description' => $workflow->description,
                'document_type' => $workflow->document_type,
                'version' => $workflow->version,
                'steps' => $steps->map(fn ($step) => [
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
                ])->values()->all(),
            ];

            $version = $workflow->versions()->create([
                'version' => $workflow->version,
                'definition' => $definition,
                'status' => 'published',
                'published_by' => $admin->id,
                'published_at' => now(),
            ]);

            foreach ($steps as $step) {
                $version->steps()->create([
                    'original_step_id' => $step->id,
                    'name' => $step->name,
                    'step_type' => $step->step_type,
                    'position' => $step->position,
                    'office_id' => $step->office_id,
                    'approver_id' => $step->approver_id,
                    'settings' => $step->settings,
                ]);
            }

            $workflow->update([
                'status' => 'published',
            ]);
        });

        return to_route('admin.workflows.index')
            ->with('success', 'Workflow published successfully.');
    }

    public function createNewVersion(Workflow $workflow): RedirectResponse
    {
        $this->authorizeAdmin();

        DB::transaction(function () use ($workflow) {
            $workflow = Workflow::query()
                ->whereKey($workflow->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($workflow->status !== 'published') {
                abort(422, 'Only published workflows can create a new version.');
            }

            $existingSteps = $workflow->steps()
                ->orderBy('position')
                ->get();

            // Move positions temporarily to avoid the unique constraint.
            $workflow->steps()->update([
                'position' => DB::raw('position + 1000000'),
            ]);

            $workflow->update([
                'version' => $workflow->version + 1,
                'status' => 'draft',
            ]);

            foreach ($existingSteps as $index => $step) {
                $step->update([
                    'position' => $index + 1,
                ]);
            }
        });

        return to_route('admin.workflows.index')
            ->with('success', 'New workflow version created successfully.');
    }

    public function versionHistory(Workflow $workflow): Response
    {
        $this->authorizeAdmin();

        $versions = $workflow->versions()
            ->with([
                'publisher:id,name',
                'steps.office:id,code,name',
                'steps.approver:id,name,email',
            ])
            ->orderByDesc('version')
            ->get()
            ->map(fn ($version) => [
                'id' => $version->id,
                'version' => $version->version,
                'status' => $version->status,
                'published_at' => $version->published_at?->toISOString(),
                'publisher' => $version->publisher ? [
                    'id' => $version->publisher->id,
                    'name' => $version->publisher->name,
                ] : null,
                'definition' => $version->definition,
                'steps' => $version->steps->map(fn ($step) => [
                    'id' => $step->id,
                    'original_step_id' => $step->original_step_id,
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
                    ] : null,
                    'settings' => $step->settings,
                ])->values()->all(),
            ]);

        return Inertia::render('admin/workflows/history', [
            'workflow' => [
                'id' => $workflow->id,
                'name' => $workflow->name,
                'code' => $workflow->code,
                'version' => $workflow->version,
                'status' => $workflow->status,
            ],
            'versions' => $versions,
        ]);
    }
}

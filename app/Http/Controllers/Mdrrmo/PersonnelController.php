<?php

namespace App\Http\Controllers\Mdrrmo;

use App\Http\Controllers\Controller;
use App\Models\MdrrmoPersonnel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PersonnelController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'role' => (string) $request->query('role', ''),
            'employment_status' => (string) $request->query('employment_status', ''),
            'availability_status' => (string) $request->query('availability_status', ''),
        ];

        $query = MdrrmoPersonnel::query();

        if ($filters['search'] !== '') {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('employee_id', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('license_number', 'like', "%{$search}%");
            });
        }

        if ($filters['role'] !== '') {
            $query->where('role', $filters['role']);
        }

        if ($filters['employment_status'] !== '') {
            $query->where('employment_status', $filters['employment_status']);
        }

        if ($filters['availability_status'] !== '') {
            $query->where('availability_status', $filters['availability_status']);
        }

        $personnel = $query
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('mdrrmo/personnel/index', [
            'personnel' => $personnel,
            'filters' => $filters,
            'roles' => MdrrmoPersonnel::roles(),
            'employmentStatuses' => MdrrmoPersonnel::employmentStatuses(),
            'availabilityStatuses' => MdrrmoPersonnel::availabilityStatuses(),
            'stats' => [
                'total' => MdrrmoPersonnel::count(),
                'active' => MdrrmoPersonnel::where(
                    'employment_status',
                    MdrrmoPersonnel::EMPLOYMENT_ACTIVE
                )->count(),
                'available' => MdrrmoPersonnel::where(
                    'employment_status',
                    MdrrmoPersonnel::EMPLOYMENT_ACTIVE
                )->where(
                    'availability_status',
                    MdrrmoPersonnel::AVAILABILITY_AVAILABLE
                )->count(),
                'assigned' => MdrrmoPersonnel::where(
                    'availability_status',
                    MdrrmoPersonnel::AVAILABILITY_ASSIGNED
                )->count(),
                'inactive' => MdrrmoPersonnel::where(
                    'employment_status',
                    MdrrmoPersonnel::EMPLOYMENT_INACTIVE
                )->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => [
                'required',
                'string',
                'max:50',
                Rule::unique('mdrrmo_personnel', 'employee_id'),
            ],
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
            'role' => [
                'required',
                Rule::in(array_keys(MdrrmoPersonnel::roles())),
            ],
            'license_number' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('mdrrmo_personnel', 'license_number'),
                Rule::requiredIf($request->input('role') === MdrrmoPersonnel::ROLE_DRIVER),
            ],
            'license_class' => ['nullable', 'string', 'max:100'],
            'license_expiry' => [
                Rule::requiredIf($request->input('role') === MdrrmoPersonnel::ROLE_DRIVER),
                'nullable',
                'date',
            ],
            'employment_status' => [
                'required',
                Rule::in(array_keys(MdrrmoPersonnel::employmentStatuses())),
            ],
            'availability_status' => [
                'required',
                Rule::in(array_keys(MdrrmoPersonnel::availabilityStatuses())),
            ],
            'address' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        if (
            $validated['employment_status'] === MdrrmoPersonnel::EMPLOYMENT_INACTIVE
            && $validated['availability_status'] === MdrrmoPersonnel::AVAILABILITY_ASSIGNED
        ) {
            return back()->withErrors([
                'availability_status' => 'Inactive personnel cannot remain assigned to a mission.',
            ])->withInput();
        }

        MdrrmoPersonnel::create($validated);

        return redirect()
            ->route('mdrrmo.personnel.index')
            ->with('success', 'Personnel added successfully.');
    }

    public function show(MdrrmoPersonnel $personnel): Response
    {
        return Inertia::render('mdrrmo/personnel/show', [
            'personnel' => $personnel,
            'roles' => MdrrmoPersonnel::roles(),
            'employmentStatuses' => MdrrmoPersonnel::employmentStatuses(),
            'availabilityStatuses' => MdrrmoPersonnel::availabilityStatuses(),
        ]);
    }

    public function update(
        Request $request,
        MdrrmoPersonnel $personnel
    ): RedirectResponse {
        $validated = $request->validate([
            'employee_id' => [
                'required',
                'string',
                'max:50',
                Rule::unique('mdrrmo_personnel', 'employee_id')->ignore($personnel->id),
            ],
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
            'role' => [
                'required',
                Rule::in(array_keys(MdrrmoPersonnel::roles())),
            ],
            'license_number' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('mdrrmo_personnel', 'license_number')->ignore($personnel->id),
                Rule::requiredIf($request->input('role') === MdrrmoPersonnel::ROLE_DRIVER),
            ],
            'license_class' => ['nullable', 'string', 'max:100'],
            'license_expiry' => [
                Rule::requiredIf($request->input('role') === MdrrmoPersonnel::ROLE_DRIVER),
                'nullable',
                'date',
            ],
            'employment_status' => [
                'required',
                Rule::in(array_keys(MdrrmoPersonnel::employmentStatuses())),
            ],
            'availability_status' => [
                'required',
                Rule::in(array_keys(MdrrmoPersonnel::availabilityStatuses())),
            ],
            'address' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        if (
            $validated['employment_status'] === MdrrmoPersonnel::EMPLOYMENT_INACTIVE
            && $validated['availability_status'] === MdrrmoPersonnel::AVAILABILITY_ASSIGNED
        ) {
            return back()->withErrors([
                'availability_status' => 'Inactive personnel cannot remain assigned to a mission.',
            ])->withInput();
        }

        $personnel->update($validated);

        return redirect()
            ->route('mdrrmo.personnel.index')
            ->with('success', 'Personnel updated successfully.');
    }

    public function deactivate(MdrrmoPersonnel $personnel): RedirectResponse
    {
        if (
            $personnel->availability_status === MdrrmoPersonnel::AVAILABILITY_ASSIGNED
        ) {
            return back()->with('error', 'Personnel assigned to a mission cannot be deactivated.');
        }

        $personnel->update([
            'employment_status' => MdrrmoPersonnel::EMPLOYMENT_INACTIVE,
            'availability_status' => MdrrmoPersonnel::AVAILABILITY_OFF_DUTY,
        ]);

        return redirect()
            ->route('mdrrmo.personnel.index')
            ->with('success', 'Personnel deactivated successfully.');
    }

    public function reactivate(MdrrmoPersonnel $personnel): RedirectResponse
    {
        $personnel->update([
            'employment_status' => MdrrmoPersonnel::EMPLOYMENT_ACTIVE,
            'availability_status' => MdrrmoPersonnel::AVAILABILITY_OFF_DUTY,
        ]);

        return redirect()
            ->route('mdrrmo.personnel.index')
            ->with('success', 'Personnel reactivated successfully. Set availability when ready for duty.');
    }
}

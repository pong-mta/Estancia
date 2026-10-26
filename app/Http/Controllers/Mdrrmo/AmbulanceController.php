<?php

namespace App\Http\Controllers\Mdrrmo;

use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AmbulanceController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', '');
        $type = (string) $request->query('type', '');

        $query = Ambulance::query();

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('vehicle_code', 'like', "%{$search}%")
                    ->orWhere('plate_number', 'like', "%{$search}%")
                    ->orWhere('make', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        if ($status !== '' && array_key_exists($status, Ambulance::statuses())) {
            $query->where('status', $status);
        }

        if ($type !== '' && array_key_exists($type, Ambulance::types())) {
            $query->where('ambulance_type', $type);
        }

        $ambulances = $query->latest('id')->paginate(10)->withQueryString();

        return Inertia::render('mdrrmo/ambulances/index', [
            'ambulances' => $ambulances,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'type' => $type,
            ],
            'statuses' => Ambulance::statuses(),
            'types' => Ambulance::types(),
            'stats' => [
                'total' => Ambulance::count(),
                'available' => Ambulance::where('status', Ambulance::STATUS_AVAILABLE)->count(),
                'assigned' => Ambulance::where('status', Ambulance::STATUS_ASSIGNED)->count(),
                'onMission' => Ambulance::where('status', Ambulance::STATUS_ON_MISSION)->count(),
                'maintenance' => Ambulance::where('status', Ambulance::STATUS_MAINTENANCE)->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('mdrrmo/ambulances/create', [
            'statuses' => Ambulance::statuses(),
            'types' => Ambulance::types(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'vehicle_code' => ['required', 'string', 'max:50', 'unique:ambulances,vehicle_code'],
            'plate_number' => ['nullable', 'string', 'max:30', 'unique:ambulances,plate_number'],
            'make' => ['nullable', 'string', 'max:100'],
            'model' => ['nullable', 'string', 'max:100'],
            'year' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'ambulance_type' => ['required', 'string', Rule::in(array_keys(Ambulance::types()))],
            'status' => ['required', 'string', Rule::in(array_keys(Ambulance::statuses()))],
            'registration_number' => ['nullable', 'string', 'max:100'],
            'registration_expiry' => ['nullable', 'date'],
            'insurance_expiry' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        Ambulance::create($validated);

        return redirect()->route('mdrrmo.ambulances.index')
            ->with('success', 'Ambulance registered successfully.');
    }

    public function show(Ambulance $ambulance): Response
    {
        return Inertia::render('mdrrmo/ambulances/show', [
            'ambulance' => $ambulance,
            'statuses' => Ambulance::statuses(),
            'types' => Ambulance::types(),
        ]);
    }

    public function edit(Ambulance $ambulance): Response
    {
        return Inertia::render('mdrrmo/ambulances/edit', [
            'ambulance' => $ambulance,
            'statuses' => Ambulance::statuses(),
            'types' => Ambulance::types(),
        ]);
    }

    public function update(Request $request, Ambulance $ambulance): RedirectResponse
    {
        $validated = $request->validate([
            'vehicle_code' => ['required', 'string', 'max:50', Rule::unique('ambulances', 'vehicle_code')->ignore($ambulance->id)],
            'plate_number' => ['nullable', 'string', 'max:30', Rule::unique('ambulances', 'plate_number')->ignore($ambulance->id)],
            'make' => ['nullable', 'string', 'max:100'],
            'model' => ['nullable', 'string', 'max:100'],
            'year' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'ambulance_type' => ['required', 'string', Rule::in(array_keys(Ambulance::types()))],
            'status' => ['required', 'string', Rule::in(array_keys(Ambulance::statuses()))],
            'registration_number' => ['nullable', 'string', 'max:100'],
            'registration_expiry' => ['nullable', 'date'],
            'insurance_expiry' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        // Do not let a routine edit manually mark an active mission as available.
        if (in_array($ambulance->status, [Ambulance::STATUS_ASSIGNED, Ambulance::STATUS_ON_MISSION], true)
            && ($validated['status'] ?? $ambulance->status) !== $ambulance->status) {
            return back()->with('error', 'This ambulance has an active assignment or mission. Its status cannot be changed here.');
        }

        $ambulance->update($validated);

        return redirect()->route('mdrrmo.ambulances.index')
            ->with('success', 'Ambulance updated successfully.');
    }

    public function destroy(Ambulance $ambulance): RedirectResponse
    {
        if (in_array($ambulance->status, [Ambulance::STATUS_ASSIGNED, Ambulance::STATUS_ON_MISSION], true)) {
            return back()->with('error', 'This ambulance cannot be removed while assigned or on a mission.');
        }

        $ambulance->delete();

        return redirect()->route('mdrrmo.ambulances.index')
            ->with('success', 'Ambulance removed successfully.');
    }
}

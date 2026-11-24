<?php

namespace App\Http\Controllers\Mdrrmo;

use App\Http\Controllers\Controller;
use App\Models\Ambulance;
use App\Models\AmbulanceBooking;
use App\Models\MdrrmoPersonnel;
use App\Models\Operation;
use App\Models\OperationAmbulance;
use App\Models\OperationPersonnel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OperationController extends Controller
{
    /**
     * Display all operations.
     */
    public function index(Request $request): Response
    {
        $operations = Operation::query()
            ->with([
                'booking',
                'ambulances.ambulance',
                'personnel.personnel',
                'creator:id,name',
            ])
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim((string) $request->input('search'));

                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('operation_number', 'like', "%{$search}%")
                        ->orWhereHas('booking', function ($bookingQuery) use ($search) {
                            $bookingQuery
                                ->where('request_number', 'like', "%{$search}%")
                                ->orWhere('requester_name', 'like', "%{$search}%");
                        });
                });
            })
            ->when(
                $request->filled('status')
                    && array_key_exists((string) $request->input('status'), Operation::statuses()),
                fn ($query) => $query->where('status', $request->input('status'))
            )
            ->latest('id')
            ->paginate(10)
            ->withQueryString();
            $approvedBookings = AmbulanceBooking::query()
                ->where('status', AmbulanceBooking::STATUS_APPROVED)
                ->whereNotIn(
                    'id',
                    Operation::query()->select('booking_id')
                )
                ->latest('id')
                ->get([
                    'id',
                    'request_number',
                    'requester_name',
                    'pickup_address',
                    'destination_address',
                ]);
        return Inertia::render('mdrrmo/operations/index', [
            'operations' => $operations,
            'statuses' => Operation::statuses(),
            'approvedBookings' => $approvedBookings,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', ''),
            ],
        ]);
    }


        /**
     * Display and filter all operations that have been dispatched.
     */
        public function dispatchHistory(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $status = (string) $request->input('status', '');
        $date = (string) $request->input('date', '');

        // Only show the necessary statuses in Dispatch History.
        $dispatchStatuses = array_intersect_key(
            Operation::statuses(),
            array_flip([
                'in_progress',
                'completed',
                'cancelled',
            ])
        );

        $operations = Operation::query()
            ->with([
                'booking',
                'ambulances.ambulance',
                'personnel.personnel',
            ])
            ->whereNotNull('dispatched_at')

            // Search filter
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('operation_number', 'like', "%{$search}%")
                        ->orWhereHas('booking', function ($bookingQuery) use ($search) {
                            $bookingQuery->where(function ($bookingSearch) use ($search) {
                                $bookingSearch
                                    ->where('request_number', 'like', "%{$search}%")
                                    ->orWhere('requester_name', 'like', "%{$search}%")
                                    ->orWhere('requester_phone', 'like', "%{$search}%")
                                    ->orWhere('purpose', 'like', "%{$search}%")
                                    ->orWhere('purpose_details', 'like', "%{$search}%")
                                    ->orWhere('pickup_address', 'like', "%{$search}%")
                                    ->orWhere('pickup_barangay', 'like', "%{$search}%")
                                    ->orWhere('destination_address', 'like', "%{$search}%")
                                    ->orWhere('destination_barangay', 'like', "%{$search}%");
                            });
                        });
                });
            })

            // Status filter
            ->when(
                $status !== '' && array_key_exists($status, $dispatchStatuses),
                fn ($query) => $query->where('status', $status)
            )

            // Dispatch date filter
            ->when(
                $date !== '',
                fn ($query) => $query->whereDate('dispatched_at', $date)
            )

            ->latest('dispatched_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('mdrrmo/dispatch-history/index', [
            'operations' => $operations,
            'statuses' => $dispatchStatuses,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'date' => $date,
            ],
        ]);
    }

    /**
     * Download all dispatch records matching the Dispatch History filters.
     * The CSV file opens directly in Microsoft Excel.
     */
    public function exportDispatchHistory(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $status = (string) $request->input('status', '');
        $date = (string) $request->input('date', '');

        $dispatchStatuses = array_intersect_key(
            Operation::statuses(),
            array_flip(['in_progress', 'completed', 'cancelled'])
        );

        $operations = Operation::query()
            ->with(['booking', 'ambulances.ambulance', 'personnel.personnel'])
            ->whereNotNull('dispatched_at')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('operation_number', 'like', "%{$search}%")
                        ->orWhereHas('booking', function ($bookingQuery) use ($search) {
                            $bookingQuery->where(function ($bookingSearch) use ($search) {
                                $bookingSearch
                                    ->where('request_number', 'like', "%{$search}%")
                                    ->orWhere('requester_name', 'like', "%{$search}%")
                                    ->orWhere('requester_phone', 'like', "%{$search}%")
                                    ->orWhere('purpose', 'like', "%{$search}%")
                                    ->orWhere('purpose_details', 'like', "%{$search}%")
                                    ->orWhere('pickup_address', 'like', "%{$search}%")
                                    ->orWhere('pickup_barangay', 'like', "%{$search}%")
                                    ->orWhere('destination_address', 'like', "%{$search}%")
                                    ->orWhere('destination_barangay', 'like', "%{$search}%");
                            });
                        });
                });
            })
            ->when(
                $status !== '' && array_key_exists($status, $dispatchStatuses),
                fn ($query) => $query->where('status', $status)
            )
            ->when(
                $date !== '',
                fn ($query) => $query->whereDate('dispatched_at', $date)
            )
            ->latest('dispatched_at')
            ->get();

        return response()->streamDownload(function () use ($operations, $dispatchStatuses) {
            $output = fopen('php://output', 'w');

            // UTF-8 BOM helps spreadsheet applications display text correctly.
            fwrite($output, "\\xEF\\xBB\\xBF");

            fputcsv($output, [
                'Dispatch No.',
                'Date',
                'Time of Dispatch',
                'Time of Arrival',
                'Incident Type',
                'Location',
                'Destination',
                'Ambulance',
                'Personnel',
                'Status',
            ]);

            foreach ($operations as $operation) {
                $booking = $operation->booking;

                $location = trim(implode(', ', array_filter([
                    $booking?->pickup_address,
                    $booking?->pickup_barangay,
                ])));

                $destination = trim(implode(', ', array_filter([
                    $booking?->destination_address,
                    $booking?->destination_barangay,
                ])));

                $ambulances = $operation->ambulances
                    ->map(fn ($assignment) => $assignment->ambulance?->vehicle_code)
                    ->filter()
                    ->implode(', ');

                $personnel = $operation->personnel
                    ->map(fn ($assignment) => $assignment->personnel
                        ? trim($assignment->personnel->first_name . ' ' . $assignment->personnel->last_name)
                        : null)
                    ->filter()
                    ->implode(', ');

                fputcsv($output, [
                    $operation->operation_number,
                    $operation->dispatched_at?->format('Y-m-d'),
                    $operation->dispatched_at?->format('h:i A'),
                    $operation->returned_at?->format('h:i A') ?? 'Not yet returned',
                    $booking?->purpose ?? '',
                    $location,
                    $destination,
                    $ambulances,
                    $personnel,
                    $dispatchStatuses[$operation->status] ?? $operation->status,
                ]);
            }

            fclose($output);
        }, 'dispatch-history-' . now()->format('Y-m-d-His') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Create an operation from an approved booking.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'booking_id' => ['required', 'integer', 'exists:ambulance_bookings,id'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $operation = DB::transaction(function () use ($validated, $request) {
            $booking = AmbulanceBooking::query()
                ->lockForUpdate()
                ->findOrFail($validated['booking_id']);

            if ($booking->status !== AmbulanceBooking::STATUS_APPROVED) {
                throw ValidationException::withMessages([
                    'booking_id' => 'Only approved bookings can be converted into operations.',
                ]);
            }

            if (Operation::query()->where('booking_id', $booking->id)->exists()) {
                throw ValidationException::withMessages([
                    'booking_id' => 'An operation already exists for this booking.',
                ]);
            }

            do {
                $operationNumber = 'OPS-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6));
            } while (
                Operation::query()->where('operation_number', $operationNumber)->exists()
            );

            return Operation::create([
                'operation_number' => $operationNumber,
                'booking_id' => $booking->id,
                'status' => Operation::STATUS_PREPARING,
                'created_by' => $request->user()?->id,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return redirect()
            ->route('mdrrmo.operations.show', $operation)
            ->with('success', 'Operation created successfully. You can now assign ambulances and personnel.');
    }

    /**
     * Display operation details and resources currently available for assignment.
     */
    public function show(Operation $operation): Response
    {
        $operation->load([
            'booking',
            'ambulances.ambulance',
            'personnel.personnel',
            'creator:id,name',
        ]);

        return Inertia::render('mdrrmo/operations/show', [
            'operation' => $operation,
            'statuses' => Operation::statuses(),
            'availableAmbulances' => Ambulance::query()
                ->where('status', Ambulance::STATUS_AVAILABLE)
                ->orderBy('vehicle_code')
                ->get(),
            'availablePersonnel' => MdrrmoPersonnel::query()
                ->where('employment_status', MdrrmoPersonnel::EMPLOYMENT_ACTIVE)
                ->whereIn('availability_status', [
                    MdrrmoPersonnel::AVAILABILITY_AVAILABLE,
                    MdrrmoPersonnel::AVAILABILITY_ON_DUTY,
                ])
                ->orderBy('last_name')
                ->get(),
        ]);
    }

    /**
     * Add resources without removing any existing active assignments.
     *
     * Send ambulance_ids and/or personnel_ids. At least one non-empty list
     * must be supplied.
     */
    public function assignResources(Request $request, Operation $operation): RedirectResponse
    {
        $validated = $request->validate([
            'ambulance_ids' => ['sometimes', 'array'],
            'ambulance_ids.*' => ['required', 'integer', 'distinct', 'exists:ambulances,id'],
            'personnel_ids' => ['sometimes', 'array'],
            'personnel_ids.*' => ['required', 'integer', 'distinct', 'exists:mdrrmo_personnel,id'],
        ]);

        $ambulanceIds = $validated['ambulance_ids'] ?? [];
        $personnelIds = $validated['personnel_ids'] ?? [];

        if (count($ambulanceIds) === 0 && count($personnelIds) === 0) {
            throw ValidationException::withMessages([
                'resources' => 'Select at least one ambulance or personnel member to add.',
            ]);
        }

        DB::transaction(function () use ($operation, $ambulanceIds, $personnelIds) {
            $lockedOperation = $this->lockEditableOperation($operation);

            $this->addAmbulances($lockedOperation, $ambulanceIds);
            $this->addPersonnel($lockedOperation, $personnelIds);

            $this->refreshAssignmentStatus($lockedOperation);
        });

        return back()->with('success', 'The selected resources were added. Existing assignments were kept.');
    }

    /**
     * Replace the complete resource selection for an operation.
     *
     * The submitted arrays represent the final desired selection. Sending an
     * empty array removes all resources of that type. Released assignment rows
     * are retained and reactivated if the same resource is selected again.
     */
    public function updateResources(Request $request, Operation $operation): RedirectResponse
    {
        $validated = $request->validate([
            'ambulance_ids' => ['required', 'array'],
            'ambulance_ids.*' => ['required', 'integer', 'distinct', 'exists:ambulances,id'],
            'personnel_ids' => ['required', 'array'],
            'personnel_ids.*' => ['required', 'integer', 'distinct', 'exists:mdrrmo_personnel,id'],
        ]);

        DB::transaction(function () use ($operation, $validated) {
            $lockedOperation = $this->lockEditableOperation($operation);

            $this->replaceAmbulances($lockedOperation, $validated['ambulance_ids']);
            $this->replacePersonnel($lockedOperation, $validated['personnel_ids']);

            $this->refreshAssignmentStatus($lockedOperation);
        });

        return back()->with('success', 'Operation resource assignments were updated.');
    }

    /**
     * Dispatch all currently assigned resources.
     */
    public function dispatch(Operation $operation): RedirectResponse
    {
        DB::transaction(function () use ($operation) {
            $lockedOperation = Operation::query()
                ->lockForUpdate()
                ->findOrFail($operation->id);

            if ($lockedOperation->status !== Operation::STATUS_ASSIGNED) {
                throw ValidationException::withMessages([
                    'operation' => 'Only assigned operations can be dispatched.',
                ]);
            }

            $ambulanceAssignments = $lockedOperation->ambulances()
                ->whereNull('released_at')
                ->orderBy('ambulance_id')
                ->get();

            $personnelAssignments = $lockedOperation->personnel()
                ->whereNull('released_at')
                ->orderBy('personnel_id')
                ->get();

            if ($ambulanceAssignments->isEmpty()) {
                throw ValidationException::withMessages([
                    'operation' => 'Assign at least one ambulance before dispatch.',
                ]);
            }

            if ($personnelAssignments->isEmpty()) {
                throw ValidationException::withMessages([
                    'operation' => 'Assign at least one personnel member before dispatch.',
                ]);
            }

            $ambulances = Ambulance::query()
                ->whereIn('id', $ambulanceAssignments->pluck('ambulance_id'))
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($ambulanceAssignments as $assignment) {
                $ambulance = $ambulances->get($assignment->ambulance_id);

                if (! $ambulance || $ambulance->status !== Ambulance::STATUS_ASSIGNED) {
                    throw ValidationException::withMessages([
                        'operation' => 'An assigned ambulance is no longer in the expected assigned state.',
                    ]);
                }
            }

            $personnel = MdrrmoPersonnel::query()
                ->whereIn('id', $personnelAssignments->pluck('personnel_id'))
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($personnelAssignments as $assignment) {
                $member = $personnel->get($assignment->personnel_id);

                if (
                    ! $member
                    || $member->employment_status !== MdrrmoPersonnel::EMPLOYMENT_ACTIVE
                    || $member->availability_status !== MdrrmoPersonnel::AVAILABILITY_ASSIGNED
                ) {
                    throw ValidationException::withMessages([
                        'operation' => 'An assigned personnel member is no longer in the expected assigned state.',
                    ]);
                }
            }

            foreach ($ambulances as $ambulance) {
                $ambulance->update(['status' => Ambulance::STATUS_ON_MISSION]);
            }

            $lockedOperation->update([
                'status' => Operation::STATUS_DISPATCHED,
                'dispatched_at' => now(),
            ]);
        });

        return back()->with('success', 'Operation dispatched successfully.');
    }

    /**
     * Mark a dispatched operation as in progress.
     */
    public function start(Operation $operation): RedirectResponse
    {
        DB::transaction(function () use ($operation) {
            $lockedOperation = Operation::query()
                ->lockForUpdate()
                ->findOrFail($operation->id);

            if ($lockedOperation->status !== Operation::STATUS_DISPATCHED) {
                throw ValidationException::withMessages([
                    'operation' => 'Only dispatched operations can be started.',
                ]);
            }

            $lockedOperation->update([
                'status' => Operation::STATUS_IN_PROGRESS,
                'started_at' => now(),
            ]);
        });

        return back()->with('success', 'Operation marked as in progress.');
    }


    /**
     * Record that the dispatched operation has returned to the MDRRMO station.
     */
    public function returnToStation(Operation $operation): RedirectResponse
    {
        DB::transaction(function () use ($operation) {
            $lockedOperation = Operation::query()
                ->lockForUpdate()
                ->findOrFail($operation->id);

            if (! in_array($lockedOperation->status, [
                Operation::STATUS_DISPATCHED,
                Operation::STATUS_IN_PROGRESS,
            ], true)) {
                throw ValidationException::withMessages([
                    'operation' => 'Only dispatched or in-progress operations can be marked as returned.',
                ]);
            }

            $lockedOperation->update([
                'status' => Operation::STATUS_RETURNED,
                'returned_at' => now(),
            ]);
        });

        return back()->with('success', 'Return to MDRRMO Station recorded. You can now complete the operation.');
    }

    /**
     * Complete an operation, record its return time, and release its resources.
     *
     * Option B: the administrator confirms completion once the ambulance has
     * returned to the MDRRMO Station. Both timestamps are recorded together.
     */
    public function complete(Operation $operation): RedirectResponse
    {
        DB::transaction(function () use ($operation) {
            $lockedOperation = Operation::query()
                ->lockForUpdate()
                ->findOrFail($operation->id);

            if (! in_array($lockedOperation->status, [
                Operation::STATUS_DISPATCHED,
                Operation::STATUS_IN_PROGRESS,
            ], true)) {
                throw ValidationException::withMessages([
                    'operation' => 'Only dispatched or in-progress operations can be completed.',
                ]);
            }

            // The administrator's completion confirmation records the return
            // and completion timestamps at the same moment.
            $completionTime = now();

            $this->releaseOperationResources($lockedOperation, true);

            $lockedOperation->update([
                'status' => Operation::STATUS_COMPLETED,
                'returned_at' => $completionTime,
                'completed_at' => $completionTime,
            ]);

            $lockedOperation->booking()->update([
                'status' => AmbulanceBooking::STATUS_COMPLETED,
            ]);
        });

        return back()->with('success', 'Operation completed, return time recorded, and assigned resources released.');
    }

    /**
     * Cancel an operation before it has been dispatched.
     */
    public function cancel(Operation $operation): RedirectResponse
    {
        DB::transaction(function () use ($operation) {
            $lockedOperation = Operation::query()
                ->lockForUpdate()
                ->findOrFail($operation->id);

            if (! in_array($lockedOperation->status, [
                Operation::STATUS_PREPARING,
                Operation::STATUS_ASSIGNED,
            ], true)) {
                throw ValidationException::withMessages([
                    'operation' => 'Only preparing or assigned operations can be cancelled.',
                ]);
            }

            $this->releaseOperationResources($lockedOperation, false);

            $lockedOperation->update([
                'status' => Operation::STATUS_CANCELLED,
                'cancelled_at' => now(),
            ]);
        });

        return back()->with('success', 'Operation cancelled and its assigned resources were released.');
    }

    /**
     * Lock an operation and ensure its assignments are still editable.
     */
    private function lockEditableOperation(Operation $operation): Operation
    {
        $lockedOperation = Operation::query()
            ->lockForUpdate()
            ->findOrFail($operation->id);

        if (! in_array($lockedOperation->status, [
            Operation::STATUS_PREPARING,
            Operation::STATUS_ASSIGNED,
        ], true)) {
            throw ValidationException::withMessages([
                'operation' => 'Resources can only be changed before the operation is dispatched.',
            ]);
        }

        return $lockedOperation;
    }

    /**
     * Add ambulance assignments, keeping existing active assignments.
     */
    private function addAmbulances(Operation $operation, array $ambulanceIds): void
    {
        if ($ambulanceIds === []) {
            return;
        }

        $ambulances = Ambulance::query()
            ->whereIn('id', $ambulanceIds)
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        if ($ambulances->count() !== count(array_unique($ambulanceIds))) {
            throw ValidationException::withMessages([
                'ambulance_ids' => 'One or more selected ambulances could not be found.',
            ]);
        }

        foreach ($ambulanceIds as $id) {
            $ambulance = $ambulances->get($id);
            $existing = OperationAmbulance::query()
                ->where('operation_id', $operation->id)
                ->where('ambulance_id', $id)
                ->first();

            if ($existing && $existing->released_at === null) {
                continue;
            }

            if ($this->ambulanceHasAnotherActiveOperation($ambulance->id, $operation->id)) {
                throw ValidationException::withMessages([
                    'ambulance_ids' => "Ambulance {$ambulance->vehicle_code} already has an active operation assignment.",
                ]);
            }

            if (! $ambulance->isAvailable()) {
                throw ValidationException::withMessages([
                    'ambulance_ids' => "Ambulance {$ambulance->vehicle_code} is not available.",
                ]);
            }

            $ambulance->update(['status' => Ambulance::STATUS_ASSIGNED]);

            if ($existing) {
                $existing->update([
                    'assigned_at' => now(),
                    'released_at' => null,
                ]);
            } else {
                OperationAmbulance::create([
                    'operation_id' => $operation->id,
                    'ambulance_id' => $ambulance->id,
                    'assignment_role' => null,
                    'assigned_at' => now(),
                ]);
            }
        }
    }

    /**
     * Add personnel assignments, keeping existing active assignments.
     */
    private function addPersonnel(Operation $operation, array $personnelIds): void
    {
        if ($personnelIds === []) {
            return;
        }

        $members = MdrrmoPersonnel::query()
            ->whereIn('id', $personnelIds)
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        if ($members->count() !== count(array_unique($personnelIds))) {
            throw ValidationException::withMessages([
                'personnel_ids' => 'One or more selected personnel records could not be found.',
            ]);
        }

        foreach ($personnelIds as $id) {
            $member = $members->get($id);

            $existing = OperationPersonnel::query()
                ->where('operation_id', $operation->id)
                ->where('personnel_id', $id)
                ->first();

            if ($existing && $existing->released_at === null) {
                continue;
            }

            if ($this->personnelHasAnotherActiveOperation($member->id, $operation->id)) {
                throw ValidationException::withMessages([
                    'personnel_ids' => 'A selected personnel member already has an active operation assignment.',
                ]);
            }

            if (! $member->canBeAssigned()) {
                throw ValidationException::withMessages([
                    'personnel_ids' => 'A selected personnel member is not available for assignment.',
                ]);
            }

            // Save the original availability before changing it to assigned.
            $previousAvailability = $member->availability_status;

            $member->update([
                'availability_status' => MdrrmoPersonnel::AVAILABILITY_ASSIGNED,
            ]);

            if ($existing) {
                $existing->update([
                    'assignment_role' => $member->role,
                    'previous_availability_status' => $previousAvailability,
                    'assigned_at' => now(),
                    'released_at' => null,
                ]);
            } else {
                OperationPersonnel::create([
                    'operation_id' => $operation->id,
                    'personnel_id' => $member->id,
                    'assignment_role' => $member->role,
                    'previous_availability_status' => $previousAvailability,
                    'assigned_at' => now(),
                ]);
            }
        }
    }

    /**
     * Replace the operation's active ambulance selection with the submitted IDs.
     */
    private function replaceAmbulances(Operation $operation, array $desiredIds): void
    {
        $currentIds = $operation->ambulances()
            ->whereNull('released_at')
            ->pluck('ambulance_id')
            ->all();

        $allIds = array_values(array_unique(array_merge($currentIds, $desiredIds)));

        $ambulances = Ambulance::query()
            ->whereIn('id', $allIds)
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        if ($ambulances->count() !== count($allIds)) {
            throw ValidationException::withMessages([
                'ambulance_ids' => 'One or more ambulances could not be found.',
            ]);
        }

        $desiredLookup = array_fill_keys($desiredIds, true);

        foreach ($currentIds as $currentId) {
            if (! isset($desiredLookup[$currentId])) {
                $assignment = OperationAmbulance::query()
                    ->where('operation_id', $operation->id)
                    ->where('ambulance_id', $currentId)
                    ->whereNull('released_at')
                    ->first();

                if ($assignment) {
                    $assignment->update(['released_at' => now()]);
                    $this->makeAmbulanceAvailableIfReleased(
                        $ambulances->get($currentId),
                        Ambulance::STATUS_ASSIGNED
                    );
                }
            }
        }

        $this->addAmbulances($operation, $desiredIds);
    }

    /**
     * Replace the operation's active personnel selection with the submitted IDs.
     */
    private function replacePersonnel(Operation $operation, array $desiredIds): void
    {
        $currentIds = $operation->personnel()
            ->whereNull('released_at')
            ->pluck('personnel_id')
            ->all();

        $allIds = array_values(array_unique(array_merge($currentIds, $desiredIds)));

        $members = MdrrmoPersonnel::query()
            ->whereIn('id', $allIds)
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        if ($members->count() !== count($allIds)) {
            throw ValidationException::withMessages([
                'personnel_ids' => 'One or more personnel records could not be found.',
            ]);
        }

        $desiredLookup = array_fill_keys($desiredIds, true);

        foreach ($currentIds as $currentId) {
            if (! isset($desiredLookup[$currentId])) {
                $assignment = OperationPersonnel::query()
                    ->where('operation_id', $operation->id)
                    ->where('personnel_id', $currentId)
                    ->whereNull('released_at')
                    ->first();

                if ($assignment) {
                    $assignment->update(['released_at' => now()]);
                    $this->makePersonnelAvailableIfReleased(
                        $members->get($currentId),
                        $assignment
                    );
                }
            }
        }

        $this->addPersonnel($operation, $desiredIds);
    }

    /**
     * Check assignment records, not just the resource status field, before
     * assigning an ambulance to another operation.
     */
    private function ambulanceHasAnotherActiveOperation(int $ambulanceId, int $operationId): bool
    {
        return OperationAmbulance::query()
            ->where('ambulance_id', $ambulanceId)
            ->where('operation_id', '!=', $operationId)
            ->whereNull('released_at')
            ->whereIn('operation_id', Operation::query()
                ->whereNotIn('status', [
                    Operation::STATUS_COMPLETED,
                    Operation::STATUS_CANCELLED,
                ])
                ->select('id'))
            ->exists();
    }

    /**
     * Check assignment records, not just availability_status, before
     * assigning personnel to another operation.
     */
    private function personnelHasAnotherActiveOperation(int $personnelId, int $operationId): bool
    {
        return OperationPersonnel::query()
            ->where('personnel_id', $personnelId)
            ->where('operation_id', '!=', $operationId)
            ->whereNull('released_at')
            ->whereIn('operation_id', Operation::query()
                ->whereNotIn('status', [
                    Operation::STATUS_COMPLETED,
                    Operation::STATUS_CANCELLED,
                ])
                ->select('id'))
            ->exists();
    }

    /**
     * Restore an ambulance only if it is still marked assigned and has no
     * other unreleased assignment in a non-terminal operation.
     */
    private function makeAmbulanceAvailableIfReleased(
        ?Ambulance $ambulance,
        string $expectedStatus
    ): void {
        if (! $ambulance || $ambulance->status !== $expectedStatus) {
            return;
        }

        $hasOtherActiveAssignment = OperationAmbulance::query()
            ->where('ambulance_id', $ambulance->id)
            ->whereNull('released_at')
            ->whereHas('operation', function ($query) {
                $query->whereNotIn('status', [
                    Operation::STATUS_COMPLETED,
                    Operation::STATUS_CANCELLED,
                ]);
            })
            ->exists();

        if (! $hasOtherActiveAssignment) {
            $ambulance->update(['status' => Ambulance::STATUS_AVAILABLE]);
        }
    }

    /**
     * Restore personnel only if still assigned and not assigned elsewhere.
     */
    private function makePersonnelAvailableIfReleased(
        ?MdrrmoPersonnel $member,
        ?OperationPersonnel $assignment = null
    ): void {
        if (
            ! $member
            || $member->availability_status !== MdrrmoPersonnel::AVAILABILITY_ASSIGNED
        ) {
            return;
        }

        $hasOtherActiveAssignment = OperationPersonnel::query()
            ->where('personnel_id', $member->id)
            ->whereNull('released_at')
            ->whereHas('operation', function ($query) {
                $query->whereNotIn('status', [
                    Operation::STATUS_COMPLETED,
                    Operation::STATUS_CANCELLED,
                ]);
            })
            ->exists();

        if (! $hasOtherActiveAssignment) {
            // Restore the status recorded when this personnel member was assigned.
            $previousAvailability = $assignment?->previous_availability_status
                ?? MdrrmoPersonnel::AVAILABILITY_AVAILABLE;

            if (! in_array($previousAvailability, [
                MdrrmoPersonnel::AVAILABILITY_AVAILABLE,
                MdrrmoPersonnel::AVAILABILITY_ON_DUTY,
            ], true)) {
                $previousAvailability = MdrrmoPersonnel::AVAILABILITY_AVAILABLE;
            }

            $member->update([
                'availability_status' => $previousAvailability,
            ]);
        }
    }

    /**
     * Release all active assignments for an operation.
     */
    private function releaseOperationResources(Operation $operation, bool $wasDispatched): void
    {
        $ambulanceAssignments = $operation->ambulances()
            ->whereNull('released_at')
            ->orderBy('ambulance_id')
            ->get();

        $ambulances = Ambulance::query()
            ->whereIn('id', $ambulanceAssignments->pluck('ambulance_id'))
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        foreach ($ambulanceAssignments as $assignment) {
            $assignment->update(['released_at' => now()]);
            $this->makeAmbulanceAvailableIfReleased(
                $ambulances->get($assignment->ambulance_id),
                $wasDispatched ? Ambulance::STATUS_ON_MISSION : Ambulance::STATUS_ASSIGNED
            );
        }

        $personnelAssignments = $operation->personnel()
            ->whereNull('released_at')
            ->orderBy('personnel_id')
            ->get();

        $members = MdrrmoPersonnel::query()
            ->whereIn('id', $personnelAssignments->pluck('personnel_id'))
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        foreach ($personnelAssignments as $assignment) {
            $assignment->update(['released_at' => now()]);
            $this->makePersonnelAvailableIfReleased(
                $members->get($assignment->personnel_id),
                $assignment
            );
        }
    }

    /**
     * Keep operation status aligned with its active assignments before dispatch.
     */
    private function refreshAssignmentStatus(Operation $operation): void
    {
        $hasAmbulance = $operation->ambulances()->whereNull('released_at')->exists();
        $hasPersonnel = $operation->personnel()->whereNull('released_at')->exists();

        $operation->update([
            'status' => ($hasAmbulance && $hasPersonnel)
                ? Operation::STATUS_ASSIGNED
                : Operation::STATUS_PREPARING,
        ]);
    }
}

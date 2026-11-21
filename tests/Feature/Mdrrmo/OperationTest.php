<?php

use App\Models\Ambulance;
use App\Models\AmbulanceBooking;
use App\Models\MdrrmoPersonnel;
use App\Models\Office;
use App\Models\Operation;
use App\Models\OperationAmbulance;
use App\Models\OperationPersonnel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);
// uses(Tests\TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->office = Office::create([
        'code' => 'MDRRMO',
        'name' => 'Municipal Disaster Risk Reduction and Management Office',
        'description' => 'Test office',
        'is_active' => true,
    ]);

    $this->admin = User::factory()->create([
        'office_id' => $this->office->id,
    ]);

    // These fields are intentionally set with forceFill because they are
    // not included in the User model's mass-assignable attributes.
    $this->admin->forceFill([
        'system_role' => 'mdrrmo_operations_admin',
        'is_active' => true,
    ])->save();

    $this->actingAs($this->admin);
});

function makeApprovedBooking(): AmbulanceBooking
{
    return AmbulanceBooking::create([
        'request_number' => 'REQ-' . fake()->unique()->numerify('######'),
        'requester_name' => fake()->name(),
        'requester_phone' => '09171234567',
        'requester_email' => fake()->safeEmail(),
        'purpose' => 'Medical Emergency',
        'purpose_details' => 'Feature test booking',
        'passenger_count' => 1,
        'pickup_address' => 'Barangay Hall',
        'pickup_barangay' => 'Poblacion',
        'destination_address' => 'District Hospital',
        'destination_barangay' => 'Poblacion',
        'requested_date' => now()->addDay()->toDateString(),
        'requested_time' => '09:00:00',
        'status' => AmbulanceBooking::STATUS_APPROVED,
    ]);
}

function makeAvailableAmbulance(): Ambulance
{
    return Ambulance::create([
        'vehicle_code' => 'AMB-' . fake()->unique()->numerify('####'),
        'plate_number' => 'ABC-' . fake()->unique()->numerify('####'),
        'make' => 'Toyota',
        'model' => 'HiAce',
        'year' => 2022,
        'ambulance_type' => Ambulance::TYPE_BASIC,
        'status' => Ambulance::STATUS_AVAILABLE,
    ]);
}

function makeAvailablePersonnel(): MdrrmoPersonnel
{
    return MdrrmoPersonnel::create([
        'employee_id' => 'EMP-' . fake()->unique()->numerify('####'),
        'first_name' => fake()->firstName(),
        'last_name' => fake()->lastName(),
        'role' => MdrrmoPersonnel::ROLE_DRIVER,
        'employment_status' => MdrrmoPersonnel::EMPLOYMENT_ACTIVE,
        'availability_status' => MdrrmoPersonnel::AVAILABILITY_AVAILABLE,
    ]);
}

function makeOperation(): Operation
{
    $booking = makeApprovedBooking();

    return Operation::create([
        'operation_number' => 'OPS-' . fake()->unique()->numerify('##########'),
        'booking_id' => $booking->id,
        'status' => Operation::STATUS_PREPARING,
        'created_by' => auth()->id(),
        'notes' => 'Created for feature testing',
    ]);
}

test('authorized MDRRMO operations administrator can view operations', function () {
    $response = $this->get(route('mdrrmo.operations.index'));

    $response->assertOk();
});

test('user without the MDRRMO operations administrator role is forbidden', function () {
    $ordinaryUser = User::factory()->create([
        'office_id' => $this->office->id,
    ]);

    $ordinaryUser->forceFill([
        'system_role' => 'regular_user',
        'is_active' => true,
    ])->save();

    $response = $this->actingAs($ordinaryUser)
        ->get(route('mdrrmo.operations.index'));

    $response->assertForbidden();
});

test('administrator can create an operation from an approved booking', function () {
    $booking = makeApprovedBooking();

    $response = $this->post(route('mdrrmo.operations.store'), [
        'booking_id' => $booking->id,
        'notes' => 'Emergency response',
    ]);

    $operation = Operation::where('booking_id', $booking->id)->first();

    expect($operation)->not->toBeNull()
        ->and($operation->status)->toBe(Operation::STATUS_PREPARING)
        ->and($operation->created_by)->toBe($this->admin->id);

    $response->assertRedirect(route('mdrrmo.operations.show', $operation));
});

test('administrator cannot create an operation from a pending booking', function () {
    $booking = makeApprovedBooking();
    $booking->update(['status' => AmbulanceBooking::STATUS_PENDING]);

    $response = $this->from(route('mdrrmo.operations.index'))
        ->post(route('mdrrmo.operations.store'), [
            'booking_id' => $booking->id,
        ]);

    $response->assertSessionHasErrors('booking_id');
    expect(Operation::where('booking_id', $booking->id)->exists())->toBeFalse();
});

test('administrator cannot create a second operation for the same booking', function () {
    $operation = makeOperation();

    $response = $this->from(route('mdrrmo.operations.index'))
        ->post(route('mdrrmo.operations.store'), [
            'booking_id' => $operation->booking_id,
        ]);

    $response->assertSessionHasErrors('booking_id');
    expect(Operation::where('booking_id', $operation->booking_id)->count())->toBe(1);
});

test('administrator can assign an ambulance and available personnel', function () {
    $operation = makeOperation();
    $ambulance = makeAvailableAmbulance();
    $personnel = makeAvailablePersonnel();

    $response = $this->post(
        route('mdrrmo.operations.assign-resources', $operation),
        [
            'ambulance_ids' => [$ambulance->id],
            'personnel_ids' => [$personnel->id],
        ]
    );

    $response->assertSessionHasNoErrors();

    expect(OperationAmbulance::where('operation_id', $operation->id)
        ->where('ambulance_id', $ambulance->id)
        ->whereNull('released_at')->exists())->toBeTrue()
        ->and(OperationPersonnel::where('operation_id', $operation->id)
            ->where('personnel_id', $personnel->id)
            ->whereNull('released_at')->exists())->toBeTrue()
        ->and($ambulance->fresh()->status)->toBe(Ambulance::STATUS_ASSIGNED)
        ->and($personnel->fresh()->availability_status)->toBe(MdrrmoPersonnel::AVAILABILITY_ASSIGNED)
        ->and($operation->fresh()->status)->toBe(Operation::STATUS_ASSIGNED);
});

test('administrator cannot assign an ambulance that is not available', function () {
    $operation = makeOperation();
    $ambulance = makeAvailableAmbulance();
    $ambulance->update(['status' => Ambulance::STATUS_MAINTENANCE]);

    $response = $this->from(route('mdrrmo.operations.show', $operation))
        ->post(route('mdrrmo.operations.assign-resources', $operation), [
            'ambulance_ids' => [$ambulance->id],
        ]);

    $response->assertSessionHasErrors('ambulance_ids');

    expect($ambulance->fresh()->status)->toBe(Ambulance::STATUS_MAINTENANCE)
        ->and(OperationAmbulance::where('operation_id', $operation->id)->exists())->toBeFalse();
});

test('administrator can dispatch and start an assigned operation', function () {
    $operation = makeOperation();
    $ambulance = makeAvailableAmbulance();
    $personnel = makeAvailablePersonnel();

    $this->post(route('mdrrmo.operations.assign-resources', $operation), [
        'ambulance_ids' => [$ambulance->id],
        'personnel_ids' => [$personnel->id],
    ])->assertSessionHasNoErrors();

    $this->patch(route('mdrrmo.operations.dispatch', $operation))
        ->assertSessionHasNoErrors();

    expect($operation->fresh()->status)->toBe(Operation::STATUS_DISPATCHED)
        ->and($ambulance->fresh()->status)->toBe(Ambulance::STATUS_ON_MISSION);

    $this->patch(route('mdrrmo.operations.start', $operation))
        ->assertSessionHasNoErrors();

    expect($operation->fresh()->status)->toBe(Operation::STATUS_IN_PROGRESS)
        ->and($operation->fresh()->started_at)->not->toBeNull();
});

test('completing an operation releases resources and completes its booking', function () {
    $operation = makeOperation();
    $ambulance = makeAvailableAmbulance();
    $personnel = makeAvailablePersonnel();

    $this->post(route('mdrrmo.operations.assign-resources', $operation), [
        'ambulance_ids' => [$ambulance->id],
        'personnel_ids' => [$personnel->id],
    ])->assertSessionHasNoErrors();

    $this->patch(route('mdrrmo.operations.dispatch', $operation))
        ->assertSessionHasNoErrors();

    $this->patch(route('mdrrmo.operations.complete', $operation))
        ->assertSessionHasNoErrors();

    expect($operation->fresh()->status)->toBe(Operation::STATUS_COMPLETED)
        ->and($operation->fresh()->completed_at)->not->toBeNull()
        ->and($operation->booking->fresh()->status)->toBe(AmbulanceBooking::STATUS_COMPLETED)
        ->and($ambulance->fresh()->status)->toBe(Ambulance::STATUS_AVAILABLE)
        ->and($personnel->fresh()->availability_status)->toBe(MdrrmoPersonnel::AVAILABILITY_AVAILABLE)
        ->and(OperationAmbulance::where('operation_id', $operation->id)->whereNull('released_at')->exists())->toBeFalse()
        ->and(OperationPersonnel::where('operation_id', $operation->id)->whereNull('released_at')->exists())->toBeFalse();
});

test('cancelling a preparing operation releases its assigned resources', function () {
    $operation = makeOperation();
    $ambulance = makeAvailableAmbulance();
    $personnel = makeAvailablePersonnel();

    $this->post(route('mdrrmo.operations.assign-resources', $operation), [
        'ambulance_ids' => [$ambulance->id],
        'personnel_ids' => [$personnel->id],
    ])->assertSessionHasNoErrors();

    $this->patch(route('mdrrmo.operations.cancel', $operation))
        ->assertSessionHasNoErrors();

    expect($operation->fresh()->status)->toBe(Operation::STATUS_CANCELLED)
        ->and($operation->fresh()->cancelled_at)->not->toBeNull()
        ->and($ambulance->fresh()->status)->toBe(Ambulance::STATUS_AVAILABLE)
        ->and($personnel->fresh()->availability_status)->toBe(MdrrmoPersonnel::AVAILABILITY_AVAILABLE);
});

test('administrator can replace assignments and release removed resources', function () {
    $operation = makeOperation();
    $firstAmbulance = makeAvailableAmbulance();
    $secondAmbulance = makeAvailableAmbulance();
    $firstPersonnel = makeAvailablePersonnel();
    $secondPersonnel = makeAvailablePersonnel();

    $this->post(route('mdrrmo.operations.assign-resources', $operation), [
        'ambulance_ids' => [$firstAmbulance->id],
        'personnel_ids' => [$firstPersonnel->id],
    ])->assertSessionHasNoErrors();

    $this->patch(route('mdrrmo.operations.update-resources', $operation), [
        'ambulance_ids' => [$secondAmbulance->id],
        'personnel_ids' => [$secondPersonnel->id],
    ])->assertSessionHasNoErrors();

    expect($firstAmbulance->fresh()->status)->toBe(Ambulance::STATUS_AVAILABLE)
        ->and($secondAmbulance->fresh()->status)->toBe(Ambulance::STATUS_ASSIGNED)
        ->and($firstPersonnel->fresh()->availability_status)->toBe(MdrrmoPersonnel::AVAILABILITY_AVAILABLE)
        ->and($secondPersonnel->fresh()->availability_status)->toBe(MdrrmoPersonnel::AVAILABILITY_ASSIGNED)
        ->and(OperationAmbulance::where('operation_id', $operation->id)->whereNull('released_at')->pluck('ambulance_id')->all())
            ->toBe([$secondAmbulance->id])
        ->and(OperationPersonnel::where('operation_id', $operation->id)->whereNull('released_at')->pluck('personnel_id')->all())
            ->toBe([$secondPersonnel->id]);
});

test('administrator cannot assign an ambulance with an active assignment even if its status says available', function () {
    $firstOperation = makeOperation();
    $secondOperation = makeOperation();
    $ambulance = makeAvailableAmbulance();

    // Seed the existing active assignment directly so this test isolates the
    // duplicate-assignment protection from the first operation's HTTP workflow.
    OperationAmbulance::create([
        'operation_id' => $firstOperation->id,
        'ambulance_id' => $ambulance->id,
        'assigned_at' => now(),
        'released_at' => null,
    ]);

    // Simulate inconsistent resource status while keeping the active assignment.
    $ambulance->update(['status' => Ambulance::STATUS_AVAILABLE]);

    $this->from(route('mdrrmo.operations.show', $secondOperation))
        ->post(route('mdrrmo.operations.assign-resources', $secondOperation), [
            'ambulance_ids' => [$ambulance->id],
        ])
        ->assertSessionHasErrors('ambulance_ids');

    expect(OperationAmbulance::where('operation_id', $firstOperation->id)
        ->where('ambulance_id', $ambulance->id)
        ->whereNull('released_at')->exists())->toBeTrue()
        ->and(OperationAmbulance::where('operation_id', $secondOperation->id)
            ->where('ambulance_id', $ambulance->id)->exists())->toBeFalse()
        ->and($ambulance->fresh()->status)->toBe(Ambulance::STATUS_AVAILABLE);
});

test('administrator cannot assign personnel with an active assignment even if availability says available', function () {
    $firstOperation = makeOperation();
    $secondOperation = makeOperation();
    $personnel = makeAvailablePersonnel();

    // Seed the existing active assignment directly so this test isolates the
    // duplicate-assignment protection from the first operation's HTTP workflow.
    OperationPersonnel::create([
        'operation_id' => $firstOperation->id,
        'personnel_id' => $personnel->id,
        'assignment_role' => $personnel->role,
        'assigned_at' => now(),
        'released_at' => null,
    ]);

    // Simulate inconsistent availability while keeping the active assignment.
    $personnel->update([
        'availability_status' => MdrrmoPersonnel::AVAILABILITY_AVAILABLE,
    ]);

    $this->from(route('mdrrmo.operations.show', $secondOperation))
        ->post(route('mdrrmo.operations.assign-resources', $secondOperation), [
            'personnel_ids' => [$personnel->id],
        ])
        ->assertSessionHasErrors('personnel_ids');

    expect(OperationPersonnel::where('operation_id', $firstOperation->id)
        ->where('personnel_id', $personnel->id)
        ->whereNull('released_at')->exists())->toBeTrue()
        ->and(OperationPersonnel::where('operation_id', $secondOperation->id)
            ->where('personnel_id', $personnel->id)->exists())->toBeFalse()
        ->and($personnel->fresh()->availability_status)->toBe(MdrrmoPersonnel::AVAILABILITY_AVAILABLE);
});

test('resources can be assigned to another operation after their previous operation is cancelled', function () {
    $firstOperation = makeOperation();
    $secondOperation = makeOperation();
    $ambulance = makeAvailableAmbulance();
    $personnel = makeAvailablePersonnel();

    $this->post(route('mdrrmo.operations.assign-resources', $firstOperation), [
        'ambulance_ids' => [$ambulance->id],
        'personnel_ids' => [$personnel->id],
    ])->assertSessionHasNoErrors();

    $this->patch(route('mdrrmo.operations.cancel', $firstOperation))
        ->assertSessionHasNoErrors();

    $this->post(route('mdrrmo.operations.assign-resources', $secondOperation), [
        'ambulance_ids' => [$ambulance->id],
        'personnel_ids' => [$personnel->id],
    ])->assertSessionHasNoErrors();

    expect(OperationAmbulance::where('operation_id', $firstOperation->id)
        ->where('ambulance_id', $ambulance->id)
        ->whereNotNull('released_at')->exists())->toBeTrue()
        ->and(OperationPersonnel::where('operation_id', $firstOperation->id)
            ->where('personnel_id', $personnel->id)
            ->whereNotNull('released_at')->exists())->toBeTrue()
        ->and(OperationAmbulance::where('operation_id', $secondOperation->id)
            ->where('ambulance_id', $ambulance->id)
            ->whereNull('released_at')->exists())->toBeTrue()
        ->and(OperationPersonnel::where('operation_id', $secondOperation->id)
            ->where('personnel_id', $personnel->id)
            ->whereNull('released_at')->exists())->toBeTrue()
        ->and($ambulance->fresh()->status)->toBe(Ambulance::STATUS_ASSIGNED)
        ->and($personnel->fresh()->availability_status)->toBe(MdrrmoPersonnel::AVAILABILITY_ASSIGNED);
});

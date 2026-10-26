<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MdrrmoPersonnel extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'mdrrmo_personnel';

    protected $fillable = [
        'employee_id',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'phone',
        'email',
        'role',
        'license_number',
        'license_class',
        'license_expiry',
        'employment_status',
        'availability_status',
        'address',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'license_expiry' => 'date',
        ];
    }

    public const ROLE_DRIVER = 'driver';
    public const ROLE_EMT = 'emt';
    public const ROLE_PARAMEDIC = 'paramedic';
    public const ROLE_NURSE = 'nurse';
    public const ROLE_OTHER = 'other';

    public const EMPLOYMENT_ACTIVE = 'active';
    public const EMPLOYMENT_INACTIVE = 'inactive';

    public const AVAILABILITY_AVAILABLE = 'available';
    public const AVAILABILITY_ASSIGNED = 'assigned';
    public const AVAILABILITY_ON_DUTY = 'on_duty';
    public const AVAILABILITY_OFF_DUTY = 'off_duty';

    public static function roles(): array
    {
        return [
            self::ROLE_DRIVER => 'Driver',
            self::ROLE_EMT => 'Emergency Medical Technician',
            self::ROLE_PARAMEDIC => 'Paramedic',
            self::ROLE_NURSE => 'Nurse',
            self::ROLE_OTHER => 'Other Personnel',
        ];
    }

    public static function employmentStatuses(): array
    {
        return [
            self::EMPLOYMENT_ACTIVE => 'Active',
            self::EMPLOYMENT_INACTIVE => 'Inactive',
        ];
    }

    public static function availabilityStatuses(): array
    {
        return [
            self::AVAILABILITY_AVAILABLE => 'Available',
            self::AVAILABILITY_ASSIGNED => 'Assigned',
            self::AVAILABILITY_ON_DUTY => 'On Duty',
            self::AVAILABILITY_OFF_DUTY => 'Off Duty',
        ];
    }

    public function getFullNameAttribute(): string
    {
        return trim(implode(' ', array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
            $this->suffix,
        ])));
    }

    public function isActive(): bool
    {
        return $this->employment_status === self::EMPLOYMENT_ACTIVE;
    }

    public function isAvailable(): bool
    {
        return $this->employment_status === self::EMPLOYMENT_ACTIVE
            && $this->availability_status === self::AVAILABILITY_AVAILABLE;
    }

    public function canBeAssigned(): bool
    {
        return $this->isAvailable();
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ambulance extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_AVAILABLE = 'available';
    public const STATUS_ASSIGNED = 'assigned';
    public const STATUS_ON_MISSION = 'on_mission';
    public const STATUS_MAINTENANCE = 'maintenance';
    public const STATUS_INACTIVE = 'inactive';

    public const TYPE_BASIC = 'basic';
    public const TYPE_ADVANCED = 'advanced';
    public const TYPE_NEONATAL = 'neonatal';
    public const TYPE_SPECIALIZED = 'specialized';

    protected $fillable = [
        'vehicle_code',
        'plate_number',
        'make',
        'model',
        'year',
        'ambulance_type',
        'status',
        'registration_number',
        'registration_expiry',
        'insurance_expiry',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'registration_expiry' => 'date',
            'insurance_expiry' => 'date',
        ];
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_AVAILABLE => 'Available',
            self::STATUS_ASSIGNED => 'Assigned',
            self::STATUS_ON_MISSION => 'On Mission',
            self::STATUS_MAINTENANCE => 'Maintenance',
            self::STATUS_INACTIVE => 'Inactive',
        ];
    }

    public static function types(): array
    {
        return [
            self::TYPE_BASIC => 'Basic Life Support',
            self::TYPE_ADVANCED => 'Advanced Life Support',
            self::TYPE_NEONATAL => 'Neonatal Ambulance',
            self::TYPE_SPECIALIZED => 'Specialized Ambulance',
        ];
    }

    public function isAvailable(): bool
    {
        return $this->status === self::STATUS_AVAILABLE;
    }

    public function isOperational(): bool
    {
        return in_array($this->status, [
            self::STATUS_AVAILABLE,
            self::STATUS_ASSIGNED,
            self::STATUS_ON_MISSION,
        ], true);
    }

    /**
     * Booking relationship will be enabled when the
     * AmbulanceBooking model and its foreign key exist.
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(AmbulanceBooking::class);
    }
}

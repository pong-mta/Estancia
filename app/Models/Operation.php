<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Operation extends Model
{
    use HasFactory;

    protected $fillable = [
        'operation_number',
        'booking_id',
        'status',
        'created_by',
        'dispatched_at',
        'started_at',
        'completed_at',
        'cancelled_at',
        'notes',
    ];

    // Operation statuses
    public const STATUS_PREPARING = 'preparing';
    public const STATUS_ASSIGNED = 'assigned';
    public const STATUS_DISPATCHED = 'dispatched';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected function casts(): array
    {
        return [
            'dispatched_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * Available operation statuses.
     */
    public static function statuses(): array
    {
        return [
            self::STATUS_PREPARING => 'Preparing',
            self::STATUS_ASSIGNED => 'Assigned',
            self::STATUS_DISPATCHED => 'Dispatched',
            self::STATUS_IN_PROGRESS => 'In Progress',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
        ];
    }

    /**
     * Booking connected to this operation.
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(AmbulanceBooking::class);
    }

    /**
     * User who created this operation.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Ambulances assigned to this operation.
     */
    public function ambulances(): HasMany
    {
        return $this->hasMany(OperationAmbulance::class);
    }

    /**
     * Personnel assigned to this operation.
     */
    public function personnel(): HasMany
    {
        return $this->hasMany(OperationPersonnel::class);
    }

    /**
     * Check whether the operation is active.
     */
    public function isActive(): bool
    {
        return in_array($this->status, [
            self::STATUS_PREPARING,
            self::STATUS_ASSIGNED,
            self::STATUS_DISPATCHED,
            self::STATUS_IN_PROGRESS,
        ], true);
    }
}

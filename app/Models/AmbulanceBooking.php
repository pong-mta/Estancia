<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AmbulanceBooking extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ambulance_bookings';

    // Booking statuses
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_COMPLETED = 'completed';

    // Patient transport positions
    public const POSITION_STANDARD = 'standard';
    public const POSITION_LYING = 'lying';

    protected $fillable = [
        'request_number',
        'requester_name',
        'requester_phone',
        'requester_email',
        'purpose',
        'purpose_details',
        'passenger_count',
        'patient_position',
        'pickup_address',
        'pickup_barangay',
        'destination_address',
        'destination_barangay',
        'requested_date',
        'requested_time',
        'status',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'internal_notes',
    ];

    protected function casts(): array
    {
        return [
            'requested_date' => 'date',
            'requested_time' => 'datetime:H:i',
            'reviewed_at' => 'datetime',
            'passenger_count' => 'integer',
        ];
    }

    /**
     * Available booking statuses.
     */
    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING => 'Pending Review',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_REJECTED => 'Rejected',
            self::STATUS_CANCELLED => 'Cancelled',
            self::STATUS_COMPLETED => 'Completed',
        ];
    }

    /**
     * Available patient transport positions.
     */
    public static function patientPositions(): array
    {
        return [
            self::POSITION_STANDARD => 'Standard Position',
            self::POSITION_LYING => 'Lying Position',
        ];
    }

    /**
     * Booking reviewer relationship.
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Check whether booking is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check whether booking can be reviewed.
     */
    public function canBeReviewed(): bool
    {
        return $this->isPending();
    }
}

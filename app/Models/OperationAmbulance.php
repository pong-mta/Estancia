<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationAmbulance extends Model
{
    use HasFactory;

    protected $fillable = [
        'operation_id',
        'ambulance_id',
        'assignment_role',
        'assigned_at',
        'released_at',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'released_at' => 'datetime',
        ];
    }

    /**
     * Operation connected to this assignment.
     */
    public function operation(): BelongsTo
    {
        return $this->belongsTo(Operation::class);
    }

    /**
     * Ambulance connected to this assignment.
     */
    public function ambulance(): BelongsTo
    {
        return $this->belongsTo(Ambulance::class);
    }
}

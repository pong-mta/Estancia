<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationPersonnel extends Model
{
    use HasFactory;
    protected $table = 'operation_personnel';
    protected $fillable = [
        'operation_id',
        'personnel_id',
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
     * Personnel connected to this assignment.
     */
    public function personnel(): BelongsTo
    {
        return $this->belongsTo(MdrrmoPersonnel::class);
    }
}

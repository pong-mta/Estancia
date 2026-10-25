<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowVersionStep extends Model
{
    protected $fillable = [
        'workflow_version_id',
        'original_step_id',
        'name',
        'step_type',
        'position',
        'office_id',
        'approver_id',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'settings' => 'array',
        ];
    }

    public function workflowVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowVersion::class);
    }

    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}

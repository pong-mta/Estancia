<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentWorkflow extends Model
{
    protected $fillable = [
        'document_type',
        'document_id',
        'workflow_version_id',
        'current_step_id',
        'current_version_step_id',
        'status',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'document_id' => 'integer',
            'workflow_version_id' => 'integer',
            'current_step_id' => 'integer',
            'current_version_step_id' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * The published workflow version assigned to this document.
     */
    public function workflowVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowVersion::class);
    }

    /**
     * Legacy relationship to the original editable workflow step.
     * Kept for compatibility with existing records and code.
     */
    public function currentStep(): BelongsTo
    {
        return $this->belongsTo(
            WorkflowStep::class,
            'current_step_id'
        );
    }

    /**
     * The immutable workflow step assigned to this document.
     */
    public function currentVersionStep(): BelongsTo
    {
        return $this->belongsTo(
            WorkflowVersionStep::class,
            'current_version_step_id'
        );
    }

    /**
     * Actions recorded during this document's workflow.
     */
    public function actions(): HasMany
    {
        return $this->hasMany(WorkflowAction::class)
            ->orderBy('acted_at');
    }
}

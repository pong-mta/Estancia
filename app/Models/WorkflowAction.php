<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowAction extends Model
{
    protected $fillable = [
        'document_workflow_id',
        'workflow_step_id',
        'workflow_version_step_id',
        'user_id',
        'action',
        'comments',
        'metadata',
        'acted_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'acted_at' => 'datetime',
        ];
    }

    public function documentWorkflow(): BelongsTo
    {
        return $this->belongsTo(DocumentWorkflow::class);
    }

    /**
     * Legacy relationship to the editable workflow step.
     * Preserved for compatibility with existing action records.
     */
    public function workflowStep(): BelongsTo
    {
        return $this->belongsTo(
            WorkflowStep::class,
            'workflow_step_id'
        );
    }

    /**
     * Immutable workflow version step associated with this action.
     */
    public function workflowVersionStep(): BelongsTo
    {
        return $this->belongsTo(
            WorkflowVersionStep::class,
            'workflow_version_step_id'
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

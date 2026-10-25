<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tracking_number',
        'document_type',
        'subject',
        'description',
        'originating_office_id',
        'submitted_by',
        'status',
        'submitted_at',
        'completed_at',
        'document_template_id',
        'template_data',
        'funding_source',
        'requested_delivery_date',
        'budget_availability',
        'budget_remarks',
        'budget_amount',
        'funding_source_assigned_by',
        'funding_source_assigned_at',
    ];

    protected function casts(): array
    {
        return [
            'originating_office_id' => 'integer',
            'submitted_by' => 'integer',
            'funding_source_assigned_by' => 'integer',
            'budget_amount' => 'decimal:2',
            'submitted_at' => 'datetime',
            'completed_at' => 'datetime',
            'requested_delivery_date' => 'date',
            'funding_source_assigned_at' => 'datetime',
            'template_data' => 'array',
        ];
    }

    public function originatingOffice(): BelongsTo
    {
        return $this->belongsTo(
            Office::class,
            'originating_office_id'
        );
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'submitted_by'
        );
    }

    public function fundingSourceAssigner(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'funding_source_assigned_by'
        );
    }

    /**
     * Workflow assignments associated with this document.
     */
    public function workflowAssignments(): HasMany
    {
        return $this->hasMany(
            DocumentWorkflow::class,
            'document_id'
        )->where('document_type', 'purchase_request');
    }

    /**
     * Approval and rejection actions associated with this document.
     */
    public function workflowActions(): HasManyThrough
    {
        return $this->hasManyThrough(
            WorkflowAction::class,
            DocumentWorkflow::class,
            'document_id',
            'document_workflow_id',
            'id',
            'id'
        )->where(
            'document_workflows.document_type',
            'purchase_request'
        );
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(DocumentAttachment::class);
    }

    public function documentTemplate(): BelongsTo
    {
        return $this->belongsTo(DocumentTemplate::class);
    }

    public function purchaseRequestItems(): HasMany
    {
        return $this->hasMany(PurchaseRequestItem::class)
            ->orderBy('item_number');
    }

    public function procurement(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(\App\Models\Procurement::class, 'document_id');
    }
}

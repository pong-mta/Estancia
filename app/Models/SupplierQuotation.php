<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupplierQuotation extends Model
{
    protected $fillable = [
        'procurement_id',
        'supplier_id',
        'quotation_number',
        'quotation_date',
        'valid_until',
        'delivery_days',
        'payment_terms',
        'notes',
        'attachment_path',
        'status',
        'submitted_by',
        'submitted_at',
        'total_amount',
    ];

    protected function casts(): array
    {
        return [
            'quotation_date' => 'date',
            'valid_until' => 'date',
            'submitted_at' => 'datetime',
            'delivery_days' => 'integer',
            'total_amount' => 'decimal:2',
        ];
    }

    public function procurement(): BelongsTo
    {
        return $this->belongsTo(Procurement::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SupplierQuotationItem::class);
    }
}

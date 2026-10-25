<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequestItem extends Model
{
    protected $fillable = [
        'document_id',
        'item_number',
        'description',
        'quantity',
        'unit',
        'unit_price',
        'amount',
    ];

    protected function casts(): array
    {
        return [
            'document_id' => 'integer',
            'item_number' => 'integer',
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'amount' => 'decimal:2',
        ];
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}

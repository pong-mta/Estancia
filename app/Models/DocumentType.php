<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentType extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
        'allows_upload',
        'allows_template',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'allows_upload' => 'boolean',
            'allows_template' => 'boolean',
        ];
    }

    public function templates(): HasMany
    {
        return $this->hasMany(DocumentTemplate::class);
    }
}

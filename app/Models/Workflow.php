<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Workflow extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'document_type',
        'status',
        'version',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(WorkflowStep::class)
            ->orderBy('position');
    }
    public function versions(): HasMany
    {
        return $this->hasMany(WorkflowVersion::class)
            ->orderByDesc('version');
    }
}

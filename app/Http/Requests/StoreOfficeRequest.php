<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOfficeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasSystemRole('admin') ?? false;
    }

    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                'max:30',
                'alpha_dash',
                'unique:offices,code',
            ],
            'name' => [
                'required',
                'string',
                'max:150',
                'unique:offices,name',
            ],
            'description' => [
                'nullable',
                'string',
                'max:5000',
            ],
            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOfficeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasSystemRole('admin') ?? false;
    }

    public function rules(): array
    {
        $office = $this->route('office');

        $officeId = $office instanceof \App\Models\Office
            ? $office->id
            : $office;

        return [
            'code' => [
                'required',
                'string',
                'max:30',
                'alpha_dash',
                Rule::unique('offices', 'code')->ignore($officeId),
            ],
            'name' => [
                'required',
                'string',
                'max:150',
                Rule::unique('offices', 'name')->ignore($officeId),
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

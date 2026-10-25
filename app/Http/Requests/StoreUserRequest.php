<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasSystemRole('admin') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
            'office_id' => [
                'nullable',
                'integer',
                Rule::exists('offices', 'id')->where('is_active', true),
            ],
            'system_role' => [
                'required',
                Rule::in(['admin', 'staff', 'approver', 'records_officer']),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

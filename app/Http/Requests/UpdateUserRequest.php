<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasSystemRole('admin') ?? false;
    }

    public function rules(): array
    {
        $user = $this->route('user');

        abort_unless($user instanceof User, 404);

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'office_id' => [
                'nullable',
                'integer',
                Rule::exists('offices', 'id')->where('is_active', true),
            ],
            'system_role' => [
                'required',
                Rule::in(['admin', 'staff', 'approver', 'records_officer']),
            ],
            'is_active' => ['required', 'boolean'],
            'password' => ['nullable', 'string', 'min:12', 'confirmed'],
        ];
    }
}

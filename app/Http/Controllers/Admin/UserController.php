<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Office;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    private function authorizeAdmin(): User
    {
        $user = auth()->user();

        abort_unless(
            $user instanceof User
                && $user->hasSystemRole('admin')
                && $user->is_active,
            403,
            'You are not authorized to manage users.'
        );

        return $user;
    }

    public function index(Request $request): Response
    {
        $this->authorizeAdmin();

        $search = trim((string) $request->query('search', ''));

        $users = User::query()
            ->with('office:id,code,name')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('system_role', 'like', "%{$search}%")
                        ->orWhereHas('office', function ($officeQuery) use ($search) {
                            $officeQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('code', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'office' => $user->office ? [
                        'id' => $user->office->id,
                        'code' => $user->office->code,
                        'name' => $user->office->name,
                    ] : null,
                    'system_role' => $user->system_role,
                    'is_active' => $user->is_active,
                    'created_at' => $user->created_at?->toISOString(),
                ];
            });

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
            ],
            'offices' => Office::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name']),
            'roles' => [
                ['value' => 'staff', 'label' => 'Staff'],
                ['value' => 'approver', 'label' => 'Approver'],
                ['value' => 'records_officer', 'label' => 'Records Officer'],
                ['value' => 'admin', 'label' => 'Administrator'],
                [
                    'value' => 'mdrrmo_operations_admin',
                    'label' => 'MDRRMO Operations Admin',
                ],
            ],
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->authorizeAdmin();

        $data = $request->validated();

        $user = new User();
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->password = Hash::make($data['password']);
        $user->office_id = $data['office_id'] ?? null;
        $user->system_role = $data['system_role'];
        $user->is_active = $data['is_active'] ?? true;
        $user->save();

        return to_route('admin.users.index')
            ->with('success', 'User account successfully created.');
    }

    public function update(
        UpdateUserRequest $request,
        User $user
    ): RedirectResponse {
        $admin = $this->authorizeAdmin();
        $data = $request->validated();

        if ($admin->is($user)) {
            if (
                $data['system_role'] !== 'admin'
                || !$data['is_active']
            ) {
                throw ValidationException::withMessages([
                    'system_role' => 'You cannot remove your own administrator role or deactivate your own account.',
                ]);
            }
        }

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->office_id = $data['office_id'] ?? null;
        $user->system_role = $data['system_role'];
        $user->is_active = $data['is_active'];

        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return to_route('admin.users.index')
            ->with('success', 'User account successfully updated.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $admin = $this->authorizeAdmin();

        if ($admin->is($user)) {
            throw ValidationException::withMessages([
                'user' => 'You cannot deactivate your own administrator account.',
            ]);
        }

        $user->is_active = false;
        $user->save();

        return to_route('admin.users.index')
            ->with('success', 'User account successfully deactivated.');
    }
}

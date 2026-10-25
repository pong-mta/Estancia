<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOfficeRequest;
use App\Http\Requests\UpdateOfficeRequest;
use App\Models\Office;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OfficeController extends Controller
{
    private function authorizeAdmin(): void
    {
        abort_unless(
            auth()->user()?->hasSystemRole('admin'),
            403,
            'You are not authorized to manage offices.'
        );
    }

    public function index(Request $request): Response
    {
        $this->authorizeAdmin();

        $search = trim((string) $request->query('search', ''));

        $offices = Office::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/offices/index', [
            'offices' => $offices,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(StoreOfficeRequest $request): RedirectResponse
    {
        Office::create($request->validated());

        return to_route('admin.offices.index')
            ->with('success', 'Office created successfully.');
    }

    public function update(
        UpdateOfficeRequest $request,
        Office $office
    ): RedirectResponse {
        $office->update($request->validated());

        return to_route('admin.offices.index')
            ->with('success', 'Office updated successfully.');
    }

    public function destroy(Office $office): RedirectResponse
    {
        $this->authorizeAdmin();

        $office->update(['is_active' => false]);

        return to_route('admin.offices.index')
            ->with('success', 'Office deactivated successfully.');
    }
}

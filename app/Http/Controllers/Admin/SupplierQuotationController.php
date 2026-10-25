<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Procurement;
use App\Models\Supplier;
use App\Models\SupplierQuotation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SupplierQuotationController extends Controller
{
    public function store(Request $request, Procurement $procurement): RedirectResponse
    {
        abort_unless($procurement->status === 'canvassing', 422, 'This procurement is not open for canvassing.');

        $validated = $request->validate([
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'quotation_number' => ['nullable', 'string', 'max:100'],
            'quotation_date' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:quotation_date'],
            'delivery_days' => ['nullable', 'integer', 'min:0', 'max:3650'],
            'payment_terms' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_request_item_id' => ['required', 'integer'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0', 'max:999999999999.99'],
        ]);

        $supplier = Supplier::query()
            ->whereKey($validated['supplier_id'])
            ->where('is_active', true)
            ->first();

        if (! $supplier) {
            throw ValidationException::withMessages([
                'supplier_id' => 'Select an active supplier.',
            ]);
        }

        $requestItems = $procurement->document
            ->purchaseRequestItems()
            ->get()
            ->keyBy('id');

        foreach ($validated['items'] as $item) {
            if (! $requestItems->has((int) $item['purchase_request_item_id'])) {
                throw ValidationException::withMessages([
                    'items' => 'One or more quotation items do not belong to this Purchase Request.',
                ]);
            }
        }

        $quotation = DB::transaction(function () use ($validated, $procurement, $requestItems): SupplierQuotation {
            $quotation = $procurement->quotations()->create([
                'supplier_id' => $validated['supplier_id'],
                'quotation_number' => $validated['quotation_number'] ?? null,
                'quotation_date' => $validated['quotation_date'] ?? null,
                'valid_until' => $validated['valid_until'] ?? null,
                'delivery_days' => $validated['delivery_days'] ?? null,
                'payment_terms' => $validated['payment_terms'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'submitted',
                'submitted_by' => auth()->id(),
                'submitted_at' => now(),
                'total_amount' => 0,
            ]);

            $total = 0;

            foreach ($validated['items'] as $inputItem) {
                $requestItem = $requestItems->get((int) $inputItem['purchase_request_item_id']);
                $quantity = (float) $requestItem->quantity;
                $unitPrice = round((float) $inputItem['unit_price'], 2);
                $amount = round($quantity * $unitPrice, 2);
                $total += $amount;

                $quotation->items()->create([
                    'purchase_request_item_id' => $requestItem->id,
                    'description' => $requestItem->description,
                    'quantity' => $quantity,
                    'unit' => $requestItem->unit,
                    'unit_price' => $unitPrice,
                    'amount' => $amount,
                ]);
            }

            $quotation->update(['total_amount' => round($total, 2)]);

            return $quotation;
        });

        return back()->with('success', 'Supplier quotation recorded successfully.');
    }

    public function destroy(Procurement $procurement, SupplierQuotation $quotation): RedirectResponse
    {
        abort_unless($quotation->procurement_id === $procurement->id, 404);
        abort_unless($procurement->status === 'canvassing', 422, 'Quotations cannot be deleted after canvassing closes.');

        DB::transaction(function () use ($quotation): void {
            $quotation->items()->delete();
            $quotation->delete();
        });

        return back()->with('success', 'Quotation deleted.');
    }
}

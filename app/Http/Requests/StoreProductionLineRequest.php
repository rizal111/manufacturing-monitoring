<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductionLineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:production_lines,code',
            'description' => 'nullable|string|max:1000',
            'status' => 'nullable|in:running,idle,maintenance,stopped',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Production line name is required',
            'code.required' => 'Production line code is required',
            'code.unique' => 'This production line code already exists',
            'status.in' => 'Invalid status. Must be running, idle, maintenance, or stopped',
        ];
    }
}

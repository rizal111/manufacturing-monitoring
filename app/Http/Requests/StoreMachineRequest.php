<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMachineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'production_line_id' => 'required|exists:production_lines,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:machines,code',
            'description' => 'nullable|string|max:1000',
            'status' => 'nullable|in:running,idle,maintenance,breakdown',
            'ideal_cycle_time' => 'nullable|integer|min:1|max:3600',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'production_line_id.required' => 'Please select a production line',
            'production_line_id.exists' => 'Selected production line does not exist',
            'name.required' => 'Machine name is required',
            'code.required' => 'Machine code is required',
            'code.unique' => 'This machine code already exists',
            'ideal_cycle_time.min' => 'Cycle time must be at least 1 second',
            'ideal_cycle_time.max' => 'Cycle time cannot exceed 3600 seconds (1 hour)',
        ];
    }
}

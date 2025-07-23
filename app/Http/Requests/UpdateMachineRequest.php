<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMachineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $machineId = $this->route('machine');

        return [
            'production_line_id' => 'sometimes|required|exists:production_lines,id',
            'name' => 'sometimes|required|string|max:255',
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('machines', 'code')->ignore($machineId),
            ],
            'description' => 'nullable|string|max:1000',
            'status' => 'nullable|in:running,idle,maintenance,breakdown',
            'ideal_cycle_time' => 'nullable|integer|min:1|max:3600',
            'is_active' => 'nullable|boolean',
        ];
    }
}

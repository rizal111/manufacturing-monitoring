<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductionLineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $lineId = $this->route('production_line') ?? $this->route('line');

        return [
            'name' => 'sometimes|required|string|max:255',
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('production_lines', 'code')->ignore($lineId),
            ],
            'description' => 'nullable|string|max:1000',
            'status' => 'nullable|in:running,idle,maintenance,stopped',
            'is_active' => 'nullable|boolean',
        ];
    }
}

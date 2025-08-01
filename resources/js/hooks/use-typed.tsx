import { useForm as useInertiaForm } from '@inertiajs/react';

type InertiaFormData<T> = T & Record<string, any>;

export const useTypedForm = <T extends Record<string, any>>(initialData: T) => {
    return useInertiaForm<InertiaFormData<T>>(initialData);
};

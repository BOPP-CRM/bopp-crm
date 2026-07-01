/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { IconAlignCenter } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface Selection {
    name: string;
    value: any;
}

interface SelectProp {
    selections: Selection[];
    value?: Selection;
    onChange?: (item: Selection) => void;
    className?: string;
    dataTestid?: string;
    label?: string;
    required?: boolean;
    /** แสดงเมื่อยังไม่มีการเลือก (value เป็น undefined) */
    placeholder?: string;
}

export default function Select({ selections, value, onChange, className, dataTestid, label, required = false, placeholder }: SelectProp) {
    const [selected, setSelected] = useState<Selection | undefined>(value);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setSelected(value);
    }, [value]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const handleSelect = (item: Selection) => {
        setSelected(item);
        setIsOpen(false);
        if (onChange) {
            onChange(item);
        }
    };

    return (
        <div className="w-full flex flex-col gap-2">
            {label && (
                <label className="block text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div
                className={"flex gap-3 items-center justify-between border-2 border-text-primary rounded-xl cursor-pointer w-full bg-white px-5 py-2 " + (className ?? "")}
                onClick={() => setIsOpen(!isOpen)}
                data-testid={dataTestid}
            >
                <div className="text-md truncate flex-1 text-left">
                    {selected ? selected.name : (placeholder ?? selections[0]?.name ?? "")}
                </div>
                <IconAlignCenter size={18} className="shrink-0" />
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    <div
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-md shadow-2xl max-h-[80vh] overflow-hidden w-screen md:w-[500px] animate-slide-up mx-auto"
                        data-testid={`${dataTestid}-popup`}
                    >
                        <div className="overflow-y-auto max-h-[calc(80vh-20px)]">
                            {selections.map((item, index) => (
                                <div
                                    key={index}
                                    className={`px-5 py-4 cursor-pointer text-md hover:bg-gray-100 transition-colors border-b border-gray-100 ${selected?.value === item.value ? "bg-gray-50" : ""
                                        }`}
                                    onClick={() => handleSelect(item)}
                                >
                                    {item.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

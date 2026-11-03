"use client"

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"


interface Items {
    value: string;
    label: string;
}
interface props {
    placeHolder?: string;
    items: Items[];
    value: string;
    onValueChange: (value: string) => void
}

export function AppSelectWithSearch({ placeHolder = 'Select a value', items, value, onValueChange }: props) {
    return (
        <Combobox items={items} defaultValue={items[0]}>
            <ComboboxInput placeholder={placeHolder} />
            <ComboboxContent >
                <ComboboxEmpty >No items found.</ComboboxEmpty>
                <ComboboxList>
                    {(item: Items) => {
                        console.log('item', item)
                        return (
                            <ComboboxItem key={item.value} value={item.value}>
                                {item.label}
                            </ComboboxItem>
                        )
                    }}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}

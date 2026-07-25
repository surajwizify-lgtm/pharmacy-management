import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const sizeClasses = {
  sm: "px-1 py-1 text-sm file:h-5 rounded-sm file:text-xs",
  default: "px-2.5 py-2 text-base rounded-md md:text-sm file:h-6 file:text-sm",
  lg: "px-3 py-2.5 text-base file:h-7 rounded-lg file:text-sm",
} as const

type InputSize = keyof typeof sizeClasses

type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  size?: InputSize
}

function Input({ className, type, size = "default", ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0  border border-input bg-bg-primary transition-colors outline-none file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}

export { Input }


// import * as React from "react"
// import { Input as InputPrimitive } from "@base-ui/react/input"

// import { cn } from "@/lib/utils"

// function Input({ className, type, ...props }: React.ComponentProps<"input">) {
//   return (
//     <InputPrimitive
//       type={type}
//       data-slot="input"
//       className={cn(
//         " w-full min-w-0 rounded-lg border border-input bg-bg-primary px-2.5 py-2 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
//         className
//       )}
//       {...props}
//     />
//   )
// }

// export { Input }

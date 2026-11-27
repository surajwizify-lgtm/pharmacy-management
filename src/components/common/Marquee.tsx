export default function Marquee({ text }: { text: string }) {
    console.log(text);
    return (
        <div className="w-full flex items-center overflow-hidden ">
            <p className="marquee-text text-black/80 text-sm whitespace-nowrap">
                {text}
            </p>
        </div>
    );
}
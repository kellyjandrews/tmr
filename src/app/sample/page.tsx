"use client";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

type SampleItem = {
	id: number;
	name: string;
	description: string | null;
};

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL as string,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function SamplePage() {
	const [items, setItems] = useState<SampleItem[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			const { data, error } = await supabase
				.from<SampleItem>("sample_items")
				.select("id, name, description")
				.order("id", { ascending: true });
			if (error) {
				setError(error.message);
				return;
			}
			setItems(data ?? []);
		})();
	}, []);

	return (
		<div style={{ padding: 24 }}>
			<h1>Sample Items</h1>
			{error && <p style={{ color: "red" }}>Error: {error}</p>}
			<ul>
				{items.map((it) => (
					<li key={it.id}>
						<strong>{it.name}</strong>
						{it.description ? ` — ${it.description}` : null}
					</li>
				))}
			</ul>
		</div>
	);
}



export interface airesponse {
	 choices:
	 [{
		message:
		{
			content: string,
			role: string
		},
		finish_reason: string,
		index: number,
		logprobs: any
	}],
		object:string,
		usage:{
			prompt_tokens:number|string,
			completion_tokens:number|string,
			total_tokens:number|string
		},
		created:number|string,
		system_fingerprint:any,
		model:string,
		id:string
}
export interface worldhistory {
	event_date: string;
	event_name: string;
	core_event: string;
	seeds_influence: string;
	change_domain: "core_theme" | "geography" | "inhabitants" | "conflicts" | "tech" | null;
}

export interface inhabitants {
	name: string;
	description: string;
}

export interface worldsetting {
	world_name: string;
	core_theme: string;
	geography: string;
	inhabitants: inhabitants[];
	conflicts: string;
	tech: string;
}

export interface worldstate {
	day: string;
	last_update_date: string;
	seeds: string[],
	pending_seed_change: {
		operation: 'none' | 'add' | 'remove',
		seed: string
	},
	world_setting: worldsetting,
	history: worldhistory[];
}

export interface AIConfig {
    apiEndpoint: string;
    apiKey: string;
    modelName: string;
    maxTokens: number;
    temperature: number;
    TOPP: number;
}

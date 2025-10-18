import { airesponse } from "./interfaces";

export async function callAI(
    apiEndpoint: string,
    apiKey: string,
    modelName: string,
    maxTokens: number,
    temperature: number,
    TOPP: number,
    prompt: string
): Promise<airesponse> {
    if (!apiEndpoint || !apiKey || !modelName) {
        throw new Error(`AI服务配置不完整。请骰主在WebUI中设置。`);
    }

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelName,
                max_tokens: maxTokens,
                temperature: temperature,
                top_p: TOPP,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`AI API request failed with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('AI call failed:', error);
        throw new Error('AI服务调用失败，请检查后台日志。');
    }
}

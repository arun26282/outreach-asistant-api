import { Request, Response } from "express";
import * as cheerio from "cheerio";
import { GoogleGenAI } from '@google/genai';
import Helper from "../Helper/Helper";

interface ScrapedData {
    title: string;
    metaDescription: string | null;
    h1s: string[];
    h2s: string[];
}

class Analyse 
{
    public static async analyse(req:Request, res: Response): Promise<void> 
    {

        const validationResult = Helper.validateUrl(req.body.url);

        if (!validationResult.isValid) {
            res.status(400).json({ error: validationResult.error });
            return;
        }

        const targetUrl = validationResult.url!;

        try {
            const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch ${targetUrl}: ${response.status} ${response.statusText}`);
            }

            const html = await response.text();

            const $ = cheerio.load(html);

            const title = $('title').text().trim();
            
            const metaDescription = 
            $('meta[name="description"]').attr('content')?.trim() || 
            $('meta[property="og:description"]').attr('content')?.trim() || 
            null;

            const h1s: string[] = [];
            $('h1').each((_: number, el: any) => {
                const text = $(el).text().replace(/\s+/g, ' ').trim();
                if (text) h1s.push(text);
            });

            const h2s: string[] = [];
            $('h2').each((_: number, el: any) => {
                const text = $(el).text().replace(/\s+/g, ' ').trim();
                if (text) h2s.push(text);
            });

            const scrapedData: ScrapedData = {
                title,
                metaDescription,
                h1s,
                h2s
            };

            // 2. Generation Phase (Calling the companion static method)
            console.log(`Generating pitch for target: ${targetUrl}`);
            const emailPitch = await Analyse.generatePersonalizedPitch(scrapedData);

            // 3. Complete Response Pipeline
            res.status(200).json({
                success: true,
                preview: scrapedData,
                pitch: emailPitch || "Failed to generate outreach email."
            });

        } catch (error: any) {
            console.error(`Error scraping ${targetUrl}:`, error.message);
            res.status(500).json({ error: 'Failed to analyze the URL' });
        }
    }

    private static async generatePersonalizedPitch(scrapedData: ScrapedData)
    {
        const systemInstruction = `
            You are an expert B2B sales copywriter.
            Read the following scraped data from a target company's website:
            Generate a highly personalized cold outreach email in 4 to 6 concise sentences.
            Requirements:
            The Hook: Demonstrate a clear understanding of the company's business, goals, or recent initiatives based on the provided content. Reference at least one specific detail from their website.
            The Bridge: Seamlessly connect their specific business focus to how custom, high-performance web architecture or targeted organic promotion could accelerate their goals.
            Tone: Maintain a professional, formal, respectful, and highly conversational tone. Avoid generic compliments, exaggerated claims, or marketing buzzwords.
            Formatting: Break the text into short, 1-to-2 sentence paragraphs for maximum readability on mobile devices.
            The CTA: End with a low-friction call to action that asks a simple question to gauge interest, rather than pushing for a scheduled meeting.
            The Output: Write naturally as if a human researched the company before reaching out. Output ONLY the raw email text. Do not include subject lines, brackets, placeholders (like [Your Name]), signatures, explanations, or any text outside the email body itself.
        `;

        const userPrompt = `
            Target Company Data:
            ${JSON.stringify(scrapedData, null, 2)}
        `;

        try {

            const ai = new GoogleGenAI({});

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: userPrompt,
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.7,
                }
            });

            return response.text;
        } catch (error: any) {
            console.error("Error generating pitch via Gemini API:", error.message);
            return null;
        }
    }
}

export default Analyse;
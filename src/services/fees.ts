import { Fee } from "@/utils/types/quotes";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export async function updateQuoteFee(quoteId: number, fees: any[]) {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .update({ fees })
      .eq('id', quoteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating quote fees:', error);
    throw error;
  }
}

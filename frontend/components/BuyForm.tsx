"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { getExplorerUrl, NATIVE_CURRENCY } from "@/lib/utils";
import { Button } from "./ui/button";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import useMakeBuy from "@/hooks/launchpad/useMakeBuy";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

type Props = {
  max: number;
  min: number;
  poolAddress: string;
};
const BuyForm: React.FC<Props> = ({ min, max, poolAddress }) => {
  const { mutateAsync, isPending } = useMakeBuy(poolAddress);
  const formSchema = z.object({
    amount: z.string().refine((value) => {
      if (!value) return false;
      const minimun = min / LAMPORTS_PER_SOL;
      const maximun = max / LAMPORTS_PER_SOL;
      return (
        !isNaN(Number(value)) &&
        Number(value) >= minimun &&
        Number(value) <= maximun
      );
    }, `Amount must be between ${(min / LAMPORTS_PER_SOL).toLocaleString()} and ${(max / LAMPORTS_PER_SOL).toLocaleString()}`),
  });
  type FormSchemaType = z.infer<typeof formSchema>;
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  });

  async function onSubmit(values: FormSchemaType) {
    console.log(values);
    await toast.promise(
      () =>
        mutateAsync({
          amount: Number(values.amount),
        }),
      {
        pending: "Processing buy...",
        success: {
          render({ data }) {
            return (
              <div>
                <p>{data.message}</p>
                {data.success ? (
                  <a
                    target="_blank"
                    className="text-sm text-green-500"
                    href={getExplorerUrl("tx", data.tx as string)}
                  >
                    View transaction
                  </a>
                ) : null}
              </div>
            );
          },
        },
        error: "Failed to buy",
      }
    );
  }
  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 max-w-3xl mx-auto"
        >
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  How much {NATIVE_CURRENCY} you want to buy?
                </FormLabel>
                <FormControl>
                  <Input placeholder="0" type="number" {...field} />
                </FormControl>
                <FormDescription className="text-xs"></FormDescription>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
            Buy
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default BuyForm;

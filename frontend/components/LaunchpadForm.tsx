"use client";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import TokenAddressInfoControl from "./TokenAddressInfoControl";
import DateTimePicker24h from "./date-time-picker-24h";
import { getUnixTime } from "date-fns";
import { getExplorerUrl, NATIVE_CURRENCY } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import useCreateNewLaunchpad from "@/hooks/launchpad/useCreateNewLaunchpad";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { isPublicKey } from "@metaplex-foundation/umi";
import { Loader2Icon } from "lucide-react";
const formSchema = z
  .object({
    tokenAddress: z
      .string()
      .min(43)
      .max(44)
      .refine((value) => {
        if (!value) return false;
        return isPublicKey(value);
      }),
    saleRate: z.string().refine((value) => {
      if (!value) return false;
      return !isNaN(Number(value));
    }),
    softCap: z.string().refine((value) => {
      if (!value) return false;
      return !isNaN(Number(value));
    }),
    hardCap: z.string().refine((value) => {
      if (!value) return false;
      return !isNaN(Number(value));
    }),
    minBuy: z.string().refine((value) => {
      if (!value) return false;
      return !isNaN(Number(value));
    }),
    maxBuy: z.string().refine((value) => {
      if (!value) return false;
      return !isNaN(Number(value));
    }),
    startAt: z.coerce.date().refine((date) => date > new Date(), {
      message: "Start date must be in the future",
    }),
    endAt: z.coerce.date(),
    unsoldTokenBehavior: z.enum(["refund", "burn"]),
  })
  .refine((data) => data.startAt < data.endAt, {
    message: "End date must be after start date",
    path: ["endAt"],
  })
  .refine((data) => data.minBuy <= data.maxBuy, {
    message: "Max buy must be greater than or equals min buy",
    path: ["maxBuy"],
  })
  .refine((data) => Number(data.softCap) >= Number(data.hardCap) * 0.25, {
    message: "Softcap must be greater than or equals 25% of Hardcap",
    path: ["softCap"],
  });
// Softcap must be greater than or equals 25% of Hardcap
export type FormSchemaType = z.infer<typeof formSchema>;

const LaunchpadForm = () => {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateNewLaunchpad();
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tokenAddress: "",
      saleRate: "",
      softCap: "",
      hardCap: "",
      minBuy: "",
      maxBuy: "",
      startAt: new Date(),
      endAt: new Date(),
      unsoldTokenBehavior: "refund",
    },
  });

  async function onSubmit(values: FormSchemaType) {
    const result = await toast.promise(
      () =>
        mutateAsync({
          tokenAddress: values.tokenAddress,
          saleRate: Number(values.saleRate),
          softCap: Number(values.softCap),
          hardCap: Number(values.hardCap),
          minBuy: Number(values.minBuy),
          maxBuy: Number(values.maxBuy),
          startAt: getUnixTime(values.startAt),
          endAt: getUnixTime(values.endAt),
          unsoldTokenBehavior: values.unsoldTokenBehavior,
        }),
      {
        pending: "Creating launchpad...",
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
        error: "Failed to create launchpad",
      }
    );

    if (result.success && result.poolAddress) {
      router.push(`/explorer`);
    }
  }

  return (
    <div className="w-full space-y-5">
      <h2 className="text-xl font-bold">Create a launchpad</h2>
      <Separator />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 max-w-3xl mx-auto"
        >
          <FormField
            control={form.control}
            name="tokenAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Token address</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormDescription className="text-xs">
                  Creation Fee: 0.1 SOL
                </FormDescription>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <TokenAddressInfoControl control={form.control} />
          <div className="flex gap-8 justify-between">
            <FormField
              control={form.control}
              name="saleRate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Sale rate</FormLabel>
                  <FormControl>
                    <Input placeholder="1000" type="number" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    If I spend 1 {NATIVE_CURRENCY} on how many tokens will I
                    receive?
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <div className="w-full" />
          </div>
          <div className="flex gap-8 justify-between">
            <FormField
              control={form.control}
              name="softCap"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>SoftCap ({NATIVE_CURRENCY})</FormLabel>
                  <FormControl>
                    <Input placeholder="100" type="number" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Softcap must be greater than or equals 25% of Hardcap
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hardCap"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>HardCap ({NATIVE_CURRENCY})</FormLabel>
                  <FormControl>
                    <Input placeholder="200" type="number" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs"></FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-8 justify-between">
            <FormField
              control={form.control}
              name="minBuy"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Min Buy ({NATIVE_CURRENCY})</FormLabel>
                  <FormControl>
                    <Input placeholder="1" type="number" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs"></FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxBuy"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Max Buy ({NATIVE_CURRENCY})</FormLabel>
                  <FormControl>
                    <Input placeholder="5" type="number" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Creation Fee: 0.1 SOL
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="unsoldTokenBehavior"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>
                  What should happen to unsold tokens after the sale ends?
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="refund" />
                      </FormControl>
                      <FormLabel className="font-normal">Refund</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="burn" />
                      </FormControl>
                      <FormLabel className="font-normal">Burn</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>

                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <div className="flex gap-8 justify-between">
            <FormField
              control={form.control}
              name="startAt"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Start Time (UTC)</FormLabel>
                  <FormControl>
                    <DateTimePicker24h
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription className="text-xs"></FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endAt"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>End Time (UTC)</FormLabel>
                  <FormControl>
                    <DateTimePicker24h
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription className="text-xs"></FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2Icon className="animate-spin mr-2" />
                Creating launchpad...
              </>
            ) : (
              "Create launchpad"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default LaunchpadForm;

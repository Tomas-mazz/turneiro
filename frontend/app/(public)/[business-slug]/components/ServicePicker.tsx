'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Business, ServiceOption } from '../types'
import { BookingAddOnsModal, type BookingAddOnItem } from './BookingAddOnsModal'

type ServicePickerProps = {
  business: Business
  businessSlug: string
  allowServiceAddOns?: boolean
  selectedServices: ServiceOption[]
  onSelectServices: (next: ServiceOption[]) => void
  primaryColor: string
  pageBackgroundColor: string
  isDarkTheme?: boolean
}

type AddOnModalState = {
  pending: ServiceOption
  items: BookingAddOnItem[]
  /** When adding in multi-select mode, prepend these rows before the pending one. */
  baseBeforeAppend: ServiceOption[] | null
}

/** Service list for the one-page booking: services, subservices and add-ons. */
export function ServicePicker({
  business,
  businessSlug,
  allowServiceAddOns = false,
  selectedServices,
  onSelectServices,
  primaryColor,
  pageBackgroundColor,
  isDarkTheme = true,
}: ServicePickerProps) {
  const serviceNameColor = 'text-[color:var(--booking-fg)]'
  const serviceMetaColor = 'text-[color:var(--booking-fg-muted)]'
  const serviceRowHover = 'hover:bg-[color:var(--booking-row-hover)]'
  const bulletBorder = 'border-[color:var(--booking-bullet-border)]'
  const bulletFill = 'bg-[color:var(--booking-bullet-fill)]'

  const [openServiceSubListId, setOpenServiceSubListId] = useState<string | null>(null)
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)
  const [addOnModal, setAddOnModal] = useState<AddOnModalState | null>(null)

  const allowMultiple = !!business.settings?.allowMultipleServices

  const formatEstimatedDuration = (x: {
    duration: number
    estimatedDurationMin?: number
    estimatedDurationMax?: number
  }): string => {
    const min = x.estimatedDurationMin
    const max = x.estimatedDurationMax
    if (typeof min === 'number' && typeof max === 'number' && min > 0 && max > 0) {
      if (min === max) return `${min} min`
      return `Estimado: ${min}–${max} min`
    }
    return `${x.duration} min`
  }

  const fetchApplicableAddOns = async (selectionId: string): Promise<BookingAddOnItem[]> => {
    if (!allowServiceAddOns || !businessSlug) return []
    try {
      const { data } = await api.get<BookingAddOnItem[]>(
        `/businesses/${encodeURIComponent(businessSlug)}/add-ons`,
        { params: { selectionId } }
      )
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  const commitPendingWithAddOns = (pending: ServiceOption, addOns: BookingAddOnItem[] | undefined) => {
    const next: ServiceOption = { ...pending }
    if (addOns && addOns.length > 0) {
      next.addOns = addOns.map((a) => ({ id: a.id, name: a.name, price: a.price }))
    } else {
      delete next.addOns
    }
    return next
  }

  const finalizeSelectionWithOptionalAddOns = async (sel: ServiceOption, mode: 'single' | 'multi-add') => {
    const list = await fetchApplicableAddOns(sel.id)
    if (list.length > 0) {
      setAddOnModal({
        pending: sel,
        items: list,
        baseBeforeAppend: mode === 'multi-add' ? [...selectedServices] : null,
      })
      return
    }
    if (mode === 'single') {
      onSelectServices([commitPendingWithAddOns(sel, undefined)])
    } else {
      onSelectServices([...selectedServices, commitPendingWithAddOns(sel, undefined)])
    }
  }

  // Keep the "active" marker aligned with the last real selection
  // unless the user is currently browsing a parent service with subservices.
  useEffect(() => {
    // Keep an "active" marker aligned with the most recently selected parent (if any).
    if (selectedServices.length === 0) return
    const last = selectedServices[selectedServices.length - 1]
    const parentId = last.parentServiceId ?? null
    const activeId = parentId ?? last.id
    setActiveServiceId(activeId)
    setOpenServiceSubListId(parentId)
  }, [selectedServices])

  return (
    <div className="min-w-0">
      {addOnModal && (
        <BookingAddOnsModal
          open
          items={addOnModal.items}
          primaryColor={primaryColor}
          pageBackgroundColor={pageBackgroundColor}
          isDarkTheme={isDarkTheme}
          onClose={() => {
            const row = commitPendingWithAddOns(addOnModal.pending, undefined)
            if (addOnModal.baseBeforeAppend === null) onSelectServices([row])
            else onSelectServices([...addOnModal.baseBeforeAppend, row])
            setAddOnModal(null)
          }}
          onWithoutAddOns={() => {
            const row = commitPendingWithAddOns(addOnModal.pending, undefined)
            if (addOnModal.baseBeforeAppend === null) onSelectServices([row])
            else onSelectServices([...addOnModal.baseBeforeAppend, row])
            setAddOnModal(null)
          }}
          onConfirm={(selected) => {
            const row = commitPendingWithAddOns(
              addOnModal.pending,
              selected.length > 0 ? selected : undefined
            )
            if (addOnModal.baseBeforeAppend === null) onSelectServices([row])
            else onSelectServices([...addOnModal.baseBeforeAppend, row])
            setAddOnModal(null)
          }}
        />
      )}
          <ul className="divide-y divide-[color:var(--booking-divide)]">
            {business.services.map((s) => {
              const subServices = s.subServices ?? []
              const hasSubServices = subServices.length > 0
              const serviceSelected = selectedServices.some((x) => x.parentServiceId === s.id)
              const directSelected = selectedServices.some((x) => x.id === s.id && !x.parentServiceId)
              const isSubListOpen = openServiceSubListId === s.id
              const isActiveParent = activeServiceId === s.id
              const serviceShort = s.shortDescription?.trim() || ''

              return (
                <li key={s.id} className="py-1">
                  {/* Parent service row */}
                  <button
                    type="button"
                    onClick={() => {
                      if (hasSubServices) {
                        // Toggle: clicking the parent again closes its subservice list.
                        setActiveServiceId(s.id)
                        setOpenServiceSubListId((prev) => (prev === s.id ? null : s.id))
                        // When opening a parent list, clear any previous leaf selection so
                        // the UI doesn't imply a final choice until the user picks a subservice.
                        if (!allowMultiple && openServiceSubListId !== s.id) onSelectServices([])
                      } else {
                        // Selecting a leaf service: close any open sublists and mark it active.
                        setOpenServiceSubListId(null)
                        setActiveServiceId(s.id)
                        const sel: ServiceOption = { id: s.id, name: s.name, price: s.price, duration: s.duration }
                        if (allowMultiple) {
                          const exists = selectedServices.some((x) => x.id === sel.id && !x.parentServiceId)
                          if (exists) {
                            onSelectServices(selectedServices.filter((x) => x.id !== sel.id))
                          } else {
                            void finalizeSelectionWithOptionalAddOns(sel, 'multi-add')
                          }
                        } else {
                          void finalizeSelectionWithOptionalAddOns(sel, 'single')
                        }
                      }
                    }}
                    className={`flex w-full items-start gap-4 py-4 pl-1 pr-4 text-left transition-colors md:py-5 md:gap-5 ${serviceRowHover}`}
                  >
                    <span
                      className={`mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${bulletBorder}`}
                      aria-hidden
                    >
                      {(directSelected || serviceSelected || (hasSubServices && isSubListOpen) || isActiveParent) && (
                        <span className={`h-2 w-2 rounded-full ${bulletFill}`} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`min-w-0 truncate text-base font-medium md:text-lg ${serviceNameColor}`}>
                          {s.name}
                        </span>
                      </div>
                      {/* If the service has subservices, we don't show duration/price here */}
                      {!hasSubServices && (
                        <p className={`mt-1 text-sm md:text-base ${serviceMetaColor}`}>
                          {formatEstimatedDuration(s)}
                        </p>
                      )}
                      {serviceShort && (
                        <p className={`mt-2 text-xs md:text-sm ${serviceMetaColor}`}>{serviceShort}</p>
                      )}
                    </div>
                    {!hasSubServices && (
                      <span
                        className={`ml-6 shrink-0 pr-2 text-base font-medium md:text-lg ${serviceNameColor}`}
                      >
                        $ {s.price.toFixed(0)}
                      </span>
                    )}
                    {hasSubServices && (
                      <span
                        className={`ml-4 mt-0.5 shrink-0 text-sm ${serviceMetaColor} transition-transform duration-200 ${
                          isSubListOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                        aria-hidden
                      >
                        ▼
                      </span>
                    )}
                  </button>

                  {/* Subservices list */}
                  {hasSubServices && (
                    <div
                      className={`ml-8 overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                        isSubListOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <ul className="mt-1 space-y-1 pb-1">
                        {subServices.map((sub) => {
                          const subShort = sub.shortDescription?.trim() || ''
                          const isSelected =
                            selectedServices.some(
                              (x) => x.id === sub.id && x.parentServiceId === s.id
                            )
                          return (
                            <li key={sub.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  const sel: ServiceOption = {
                                    id: sub.id,
                                    name: `${s.name} - ${sub.name}`,
                                    price: sub.price,
                                    duration: sub.duration,
                                    parentServiceId: s.id,
                                    parentServiceName: s.name,
                                  }
                                  setOpenServiceSubListId(s.id)
                                  setActiveServiceId(s.id)
                                  if (allowMultiple) {
                                    const exists = selectedServices.some(
                                      (x) => x.id === sel.id && x.parentServiceId === sel.parentServiceId
                                    )
                                    if (exists) {
                                      onSelectServices(
                                        selectedServices.filter(
                                          (x) => !(x.id === sel.id && x.parentServiceId === sel.parentServiceId)
                                        )
                                      )
                                    } else {
                                      void finalizeSelectionWithOptionalAddOns(sel, 'multi-add')
                                    }
                                  } else {
                                    void finalizeSelectionWithOptionalAddOns(sel, 'single')
                                  }
                                }}
                                className={`flex w-full items-start gap-3 py-2 pr-4 text-left text-sm md:text-base ${serviceRowHover}`}
                              >
                                <span
                                  className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${bulletBorder}`}
                                  aria-hidden
                                >
                                  {isSelected && (
                                    <span className={`h-1.5 w-1.5 rounded-full ${bulletFill}`} />
                                  )}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className={`min-w-0 truncate ${serviceNameColor}`}>{sub.name}</span>
                                  </div>
                                  <p className={`mt-0.5 text-xs md:text-sm ${serviceMetaColor}`}>
                                    {formatEstimatedDuration(sub)}
                                  </p>
                                  {subShort && (
                                    <p className={`mt-1 text-[11px] md:text-xs ${serviceMetaColor}`}>{subShort}</p>
                                  )}
                                </div>
                                <span
                                  className={`ml-4 shrink-0 pr-1 text-sm font-medium md:text-base ${serviceNameColor}`}
                                >
                                  $ {sub.price.toFixed(0)}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
    </div>
  )
}

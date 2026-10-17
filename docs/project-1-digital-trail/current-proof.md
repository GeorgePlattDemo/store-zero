# Project 1 current digital proof

Project 1 proves the current manufacturing chain for the two-brace SPF job: identified definition and independent manifest → fresh Store answer → simulated accepted packet → independent verification → registered lowering → complete virtual replay. The 16-inch default, 18-inch centered variation and 18-inch selected-location specimen share an eight-inch horizontal span. The third specimen independently requests 1/8-inch and 1/16-inch full-diameter depths at X=5.25 and 10.25 inches. No angle, coordinate, stock choice or Q is re-entered after acceptance.

The complete serialized requests, answers, packets, local plans, records, replay and admission results are in [current-proof.json](current-proof.json). `npm run build:examples` regenerates this proof from current code and catalog; `npm test` rejects any byte disagreement. Changing executable inputs requires regeneration and review of the resulting evidence.

**Source identity:** `deebb9921ea1a406249e3d4817f4fd16845760a4618b8f8d2c01e581a5464efb` (21 package, source and data files). The reference release label is this source digest, not a deployed git identity. Fixed example times make reproduction deterministic; they are not transaction dates.

System supplies the live integration counterpart in its required Chromium job: the published nested application derives default, length and selected-location/depth revisions, receives real HTTP Store answers, records customer acceptance, exports each exact packet and submits it to the pinned Store machine-evidence endpoint. The workflow publishes the full requests, commercial source events, accepted packets and virtual evidence under its actual System and Store revisions. A reference replay alone does not establish that browser handoff.

| Requirement or result | 16-inch default | 18-inch variation | 18-inch selected locations/depths |
| --- | ---: | ---: | ---: |
| Face miter magnitude | 30° | 26.387799961243° | 26.387799961243° |
| Part-relative spot X (parts 1 / 2) | 8 in / 8 in | 9 in / 9 in | 5.25 in / 10.25 in |
| Registered spot drill diameter | 0.1875 in | 0.1875 in | 0.1875 in |
| Drill-point included angle | 118° | 118° | 118° |
| Registered nominal / maximum full-diameter depth | 0.1875 / 0.1875 in | 0.1875 / 0.1875 in | 0.1875 / 0.1875 in |
| Requested full-diameter depth (parts 1 / 2) | 0.1875 in / 0.1875 in | 0.1875 in / 0.1875 in | 0.125 in / 0.0625 in |
| Modeled total drill-tip plunge (parts 1 / 2) | 0.243830683 in / 0.243830683 in | 0.243830683 in / 0.243830683 in | 0.181330683 in / 0.118830683 in |
| Selected parent | STB-ZERO-SPF-2X4-60-001 | STB-ZERO-SPF-2X4-72-001 | STB-ZERO-SPF-2X4-72-001 |
| Material | $2.61 | $3.13 | $3.13 |
| Modeled machine service | $6.01 | $6.00 | $6.03 |
| Manufacturing Q | $8.62 | $9.13 | $9.16 |
| Occupied seconds | 86.51908661063948 | 86.46953628299116 | 86.84453628299116 |
| Ledger records | 51 | 51 | 51 |
| Modeled move events | 22 | 22 | 22 |

## Evidence and authority

The D-001 feature is an identified-location shallow pointed-drill spot (`SPOT_ON_LOCATION`), not a flat-bottom spotface, through-hole or general fastening pilot. The centered longitudinal position follows the System project rule `L/2` from the customer's selected brace length; it is not separately re-entered. Registered tool diameter is 3/16 in. Nominal full-diameter depth and maximum are separately registered at 3/16 in, measured beyond the 118° drill point. Each explicitly selected positive depth up to the maximum governs its own plunge and time; omission on the named standard spot uses the nominal. Invalid or excessive depths and incompatible physical functions are refused. The complete accepted Store plan supplies the spot Z moves. Physical inspection and commissioning remain outstanding.

The receipt binds demand, manifest, catalog, machine configuration, model and calculation. Packet verification checks that binding and independently evaluates the current definition. Lowering carries the exact selected parents and operation ledger; virtual replay consumes those records without another stock search or pricing engine. Tests reject changed definitions, altered receipts and motion records, foreign release identities and physical-release claims.

All operation times and resulting component dimensions are modeled. Datum capture is nominal; retained-face/kerf registration, saw stroke and stock-control qualification remain physical gaps. Physical admission is BLOCKED and permits zero physical motion commands. No compiled controller runtime, inspected parts, live stock reservation, actual payment or commercial return is established. The current machine functions and operating envelope are governed by Store master chapters 5, 6 and 9.

## Complete evaluated ledgers

### 16 inch specimen

Calculation input `4e02b8578ae038c2abf1f0be693c65e1a875abc62561ad8d0fc641747ba90f7c`; result `dc71daa86e862ad310ba4f27ec9429cc6eb3fdf402eeffa61ba19724b7ef842b`.

| Sequence | Operation | Subject | Seconds |
| ---: | --- | --- | ---: |
| 1 | LOAD_AND_SEAT | STB-ZERO-SPF-2X4-60-001:PART-1+PART-2 | 36 |
| 2 | MOVE A 0 → 30 | PARENT_END_ANGLE | 1.25 |
| 3 | ANGLE_SETTLE | STB-ZERO-SPF-2X4-60-001:PART-1+PART-2 | 0.1 |
| 4 | CLAMP_ALLOWANCE | STB-ZERO-SPF-2X4-60-001:PART-1+PART-2 | 0.25 |
| 5 | SAW_ON | REFERENCE_CUT | 0 |
| 6 | MOVE S 0 → 1.5 | REFERENCE_CUT | 0.5 |
| 7 | MOVE S 1.5 → 5.54145188432738 | REFERENCE_CUT | 1.272625523424272 |
| 8 | MOVE S 5.54145188432738 → 0 | REFERENCE_CUT | 1.1735753140545633 |
| 9 | SAW_OFF_ALLOWANCE | REFERENCE_CUT | 0.05 |
| 10 | SAW_OFF | REFERENCE_CUT | 0 |
| 11 | NOMINAL_DATUM_CAPTURE | REFERENCE_CUT | 0.01 |
| 12 | MOVE C 0 → 28 | SPOT-1 | 3.75 |
| 13 | VERIFY_POSITION_ALLOWANCE | SPOT-1 | 0.05 |
| 14 | CONTROL_SCREEN | SPOT-1 | 0 |
| 15 | MOVE Y 0 → 1.75 | SPOT-1 | 0.6875 |
| 16 | SPOT_SPINDLE_ON | SPOT-1 | 0 |
| 17 | SPOT_READY_ALLOWANCE | SPOT-1 | 0.5 |
| 18 | MOVE Z 1.75 → 1.5 | SPOT-1 | 0.25 |
| 19 | MOVE Z 1.5 → 1.256169316966166 | SPOT-1 | 0.6345767075845848 |
| 20 | MOVE Z 1.256169316966166 → 1.75 | SPOT-1 | 0.37191534151691696 |
| 21 | FEATURE_ANSWERED | SPOT-1 | 0 |
| 22 | MOVE C 28 → 11.875 | SPOT-2 | 2.265625 |
| 23 | VERIFY_POSITION_ALLOWANCE | SPOT-2 | 0.05 |
| 24 | CONTROL_SCREEN | SPOT-2 | 0 |
| 25 | MOVE Y 1.75 → 1.75 | SPOT-2 | 0 |
| 26 | MOVE Z 1.75 → 1.5 | SPOT-2 | 0.25 |
| 27 | MOVE Z 1.5 → 1.256169316966166 | SPOT-2 | 0.6345767075845848 |
| 28 | MOVE Z 1.256169316966166 → 1.75 | SPOT-2 | 0.37191534151691696 |
| 29 | FEATURE_ANSWERED | SPOT-2 | 0 |
| 30 | MOVE C 11.875 → -16 | PART-1 | 3.734375 |
| 31 | VERIFY_POSITION_ALLOWANCE | PART-1 | 0.05 |
| 32 | CONTROL_SCREEN | PART-1 | 0 |
| 33 | SAW_ON | PART-1 | 0 |
| 34 | MOVE S 0 → 1.5 | PART-1 | 0.5 |
| 35 | MOVE S 1.5 → 5.54145188432738 | PART-1 | 1.272625523424272 |
| 36 | MOVE S 5.54145188432738 → 0 | PART-1 | 1.1735753140545633 |
| 37 | SAW_OFF_ALLOWANCE | PART-1 | 0.05 |
| 38 | SAW_OFF | PART-1 | 0 |
| 39 | NOMINAL_DATUM_CAPTURE | PART-1 | 0.01 |
| 40 | MOVE C 0 → -16 | PART-2 | 2.25 |
| 41 | VERIFY_POSITION_ALLOWANCE | PART-2 | 0.05 |
| 42 | CONTROL_SCREEN | PART-2 | 0 |
| 43 | SAW_ON | PART-2 | 0 |
| 44 | MOVE S 0 → 1.5 | PART-2 | 0.5 |
| 45 | MOVE S 1.5 → 5.54145188432738 | PART-2 | 1.272625523424272 |
| 46 | MOVE S 5.54145188432738 → 0 | PART-2 | 1.1735753140545633 |
| 47 | SAW_OFF_ALLOWANCE | PART-2 | 0.05 |
| 48 | SAW_OFF | PART-2 | 0 |
| 49 | NOMINAL_DATUM_CAPTURE | PART-2 | 0.01 |
| 50 | SPOT_SPINDLE_OFF | PARENT_COMPLETE | 0 |
| 51 | RELEASE_AND_LABEL | STB-ZERO-SPF-2X4-60-001:PART-1+PART-2 | 24 |

### 18 inch specimen

Calculation input `3c0cb4c85476ee2e8170f3814954ef95a59864e088d24b3ab10511e632d12403`; result `f856aaf6ff3a7b9a5e6b55a0687601ae06dd8cc35ba32f665f8dbfbed1a7ccdf`.

| Sequence | Operation | Subject | Seconds |
| ---: | --- | --- | ---: |
| 1 | LOAD_AND_SEAT | STB-ZERO-SPF-2X4-72-001:PART-1+PART-2 | 36 |
| 2 | MOVE A 0 → 26.387799961243 | PARENT_END_ANGLE | 1.1295933320414333 |
| 3 | ANGLE_SETTLE | STB-ZERO-SPF-2X4-72-001:PART-1+PART-2 | 0.1 |
| 4 | CLAMP_ALLOWANCE | STB-ZERO-SPF-2X4-72-001:PART-1+PART-2 | 0.25 |
| 5 | SAW_ON | REFERENCE_CUT | 0 |
| 6 | MOVE S 0 → 1.5 | REFERENCE_CUT | 0.5 |
| 7 | MOVE S 1.5 → 5.4070941395600665 | REFERENCE_CUT | 1.235303927655574 |
| 8 | MOVE S 5.4070941395600665 → 0 | REFERENCE_CUT | 1.1511823565933446 |
| 9 | SAW_OFF_ALLOWANCE | REFERENCE_CUT | 0.05 |
| 10 | SAW_OFF | REFERENCE_CUT | 0 |
| 11 | NOMINAL_DATUM_CAPTURE | REFERENCE_CUT | 0.01 |
| 12 | MOVE C 0 → 27 | SPOT-1 | 3.625 |
| 13 | VERIFY_POSITION_ALLOWANCE | SPOT-1 | 0.05 |
| 14 | CONTROL_SCREEN | SPOT-1 | 0 |
| 15 | MOVE Y 0 → 1.75 | SPOT-1 | 0.6875 |
| 16 | SPOT_SPINDLE_ON | SPOT-1 | 0 |
| 17 | SPOT_READY_ALLOWANCE | SPOT-1 | 0.5 |
| 18 | MOVE Z 1.75 → 1.5 | SPOT-1 | 0.25 |
| 19 | MOVE Z 1.5 → 1.256169316966166 | SPOT-1 | 0.6345767075845848 |
| 20 | MOVE Z 1.256169316966166 → 1.75 | SPOT-1 | 0.37191534151691696 |
| 21 | FEATURE_ANSWERED | SPOT-1 | 0 |
| 22 | MOVE C 27 → 8.875 | SPOT-2 | 2.515625 |
| 23 | VERIFY_POSITION_ALLOWANCE | SPOT-2 | 0.05 |
| 24 | CONTROL_SCREEN | SPOT-2 | 0 |
| 25 | MOVE Y 1.75 → 1.75 | SPOT-2 | 0 |
| 26 | MOVE Z 1.75 → 1.5 | SPOT-2 | 0.25 |
| 27 | MOVE Z 1.5 → 1.256169316966166 | SPOT-2 | 0.6345767075845848 |
| 28 | MOVE Z 1.256169316966166 → 1.75 | SPOT-2 | 0.37191534151691696 |
| 29 | FEATURE_ANSWERED | SPOT-2 | 0 |
| 30 | MOVE C 8.875 → -18 | PART-1 | 3.609375 |
| 31 | VERIFY_POSITION_ALLOWANCE | PART-1 | 0.05 |
| 32 | CONTROL_SCREEN | PART-1 | 0 |
| 33 | SAW_ON | PART-1 | 0 |
| 34 | MOVE S 0 → 1.5 | PART-1 | 0.5 |
| 35 | MOVE S 1.5 → 5.4070941395600665 | PART-1 | 1.235303927655574 |
| 36 | MOVE S 5.4070941395600665 → 0 | PART-1 | 1.1511823565933446 |
| 37 | SAW_OFF_ALLOWANCE | PART-1 | 0.05 |
| 38 | SAW_OFF | PART-1 | 0 |
| 39 | NOMINAL_DATUM_CAPTURE | PART-1 | 0.01 |
| 40 | MOVE C 0 → -18 | PART-2 | 2.5 |
| 41 | VERIFY_POSITION_ALLOWANCE | PART-2 | 0.05 |
| 42 | CONTROL_SCREEN | PART-2 | 0 |
| 43 | SAW_ON | PART-2 | 0 |
| 44 | MOVE S 0 → 1.5 | PART-2 | 0.5 |
| 45 | MOVE S 1.5 → 5.4070941395600665 | PART-2 | 1.235303927655574 |
| 46 | MOVE S 5.4070941395600665 → 0 | PART-2 | 1.1511823565933446 |
| 47 | SAW_OFF_ALLOWANCE | PART-2 | 0.05 |
| 48 | SAW_OFF | PART-2 | 0 |
| 49 | NOMINAL_DATUM_CAPTURE | PART-2 | 0.01 |
| 50 | SPOT_SPINDLE_OFF | PARENT_COMPLETE | 0 |
| 51 | RELEASE_AND_LABEL | STB-ZERO-SPF-2X4-72-001:PART-1+PART-2 | 24 |

### 18-selected inch specimen

Calculation input `0da104dd6a3cf314f5da4911c10053439a247bcdd83ea745b22b62847c1379c9`; result `c8d4c91d4e7f789971b1f276169d713761fd90bbc130d8403e586eca2042cc27`.

| Sequence | Operation | Subject | Seconds |
| ---: | --- | --- | ---: |
| 1 | LOAD_AND_SEAT | STB-ZERO-SPF-2X4-72-001:PART-1+PART-2 | 36 |
| 2 | MOVE A 0 → 26.387799961243 | PARENT_END_ANGLE | 1.1295933320414333 |
| 3 | ANGLE_SETTLE | STB-ZERO-SPF-2X4-72-001:PART-1+PART-2 | 0.1 |
| 4 | CLAMP_ALLOWANCE | STB-ZERO-SPF-2X4-72-001:PART-1+PART-2 | 0.25 |
| 5 | SAW_ON | REFERENCE_CUT | 0 |
| 6 | MOVE S 0 → 1.5 | REFERENCE_CUT | 0.5 |
| 7 | MOVE S 1.5 → 5.4070941395600665 | REFERENCE_CUT | 1.235303927655574 |
| 8 | MOVE S 5.4070941395600665 → 0 | REFERENCE_CUT | 1.1511823565933446 |
| 9 | SAW_OFF_ALLOWANCE | REFERENCE_CUT | 0.05 |
| 10 | SAW_OFF | REFERENCE_CUT | 0 |
| 11 | NOMINAL_DATUM_CAPTURE | REFERENCE_CUT | 0.01 |
| 12 | MOVE C 0 → 30.75 | SPOT-1 | 4.09375 |
| 13 | VERIFY_POSITION_ALLOWANCE | SPOT-1 | 0.05 |
| 14 | CONTROL_SCREEN | SPOT-1 | 0 |
| 15 | MOVE Y 0 → 1.75 | SPOT-1 | 0.6875 |
| 16 | SPOT_SPINDLE_ON | SPOT-1 | 0 |
| 17 | SPOT_READY_ALLOWANCE | SPOT-1 | 0.5 |
| 18 | MOVE Z 1.75 → 1.5 | SPOT-1 | 0.25 |
| 19 | MOVE Z 1.5 → 1.318669316966166 | SPOT-1 | 0.47832670758458484 |
| 20 | MOVE Z 1.318669316966166 → 1.75 | SPOT-1 | 0.34066534151691696 |
| 21 | FEATURE_ANSWERED | SPOT-1 | 0 |
| 22 | MOVE C 30.75 → 7.625 | SPOT-2 | 3.140625 |
| 23 | VERIFY_POSITION_ALLOWANCE | SPOT-2 | 0.05 |
| 24 | CONTROL_SCREEN | SPOT-2 | 0 |
| 25 | MOVE Y 1.75 → 1.75 | SPOT-2 | 0 |
| 26 | MOVE Z 1.75 → 1.5 | SPOT-2 | 0.25 |
| 27 | MOVE Z 1.5 → 1.381169316966166 | SPOT-2 | 0.32207670758458484 |
| 28 | MOVE Z 1.381169316966166 → 1.75 | SPOT-2 | 0.30941534151691696 |
| 29 | FEATURE_ANSWERED | SPOT-2 | 0 |
| 30 | MOVE C 7.625 → -18 | PART-1 | 3.453125 |
| 31 | VERIFY_POSITION_ALLOWANCE | PART-1 | 0.05 |
| 32 | CONTROL_SCREEN | PART-1 | 0 |
| 33 | SAW_ON | PART-1 | 0 |
| 34 | MOVE S 0 → 1.5 | PART-1 | 0.5 |
| 35 | MOVE S 1.5 → 5.4070941395600665 | PART-1 | 1.235303927655574 |
| 36 | MOVE S 5.4070941395600665 → 0 | PART-1 | 1.1511823565933446 |
| 37 | SAW_OFF_ALLOWANCE | PART-1 | 0.05 |
| 38 | SAW_OFF | PART-1 | 0 |
| 39 | NOMINAL_DATUM_CAPTURE | PART-1 | 0.01 |
| 40 | MOVE C 0 → -18 | PART-2 | 2.5 |
| 41 | VERIFY_POSITION_ALLOWANCE | PART-2 | 0.05 |
| 42 | CONTROL_SCREEN | PART-2 | 0 |
| 43 | SAW_ON | PART-2 | 0 |
| 44 | MOVE S 0 → 1.5 | PART-2 | 0.5 |
| 45 | MOVE S 1.5 → 5.4070941395600665 | PART-2 | 1.235303927655574 |
| 46 | MOVE S 5.4070941395600665 → 0 | PART-2 | 1.1511823565933446 |
| 47 | SAW_OFF_ALLOWANCE | PART-2 | 0.05 |
| 48 | SAW_OFF | PART-2 | 0 |
| 49 | NOMINAL_DATUM_CAPTURE | PART-2 | 0.01 |
| 50 | SPOT_SPINDLE_OFF | PARENT_COMPLETE | 0 |
| 51 | RELEASE_AND_LABEL | STB-ZERO-SPF-2X4-72-001:PART-1+PART-2 | 24 |


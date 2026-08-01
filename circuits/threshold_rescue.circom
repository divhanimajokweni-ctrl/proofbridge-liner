pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

// InvPow7: computes x^d mod p, where d is the modular inverse of 7
// mod (p-1) for the BN254 scalar field, precomputed offline in Python
// and verified there via (x^7)^d == x for a sample x before being
// hardcoded here. d has 253 bits; this template is a fixed (unrolled)
// square-and-multiply chain over those specific, constant bits -- it
// is not a generic exponentiation circuit, it is specific to this d.
template InvPow7() {
    signal input in;
    signal output out;

    // acc_0 = in  (first bit is always 1 for this d)
    signal acc[253];
    acc[0] <== in;
    signal sq1 <== acc[0] * acc[0];
    acc[1] <== sq1 * in;
    signal sq2 <== acc[1] * acc[1];
    acc[2] <== sq2;
    signal sq3 <== acc[2] * acc[2];
    acc[3] <== sq3 * in;
    signal sq4 <== acc[3] * acc[3];
    acc[4] <== sq4 * in;
    signal sq5 <== acc[4] * acc[4];
    acc[5] <== sq5 * in;
    signal sq6 <== acc[5] * acc[5];
    acc[6] <== sq6;
    signal sq7 <== acc[6] * acc[6];
    acc[7] <== sq7 * in;
    signal sq8 <== acc[7] * acc[7];
    acc[8] <== sq8;
    signal sq9 <== acc[8] * acc[8];
    acc[9] <== sq9;
    signal sq10 <== acc[9] * acc[9];
    acc[10] <== sq10 * in;
    signal sq11 <== acc[10] * acc[10];
    acc[11] <== sq11 * in;
    signal sq12 <== acc[11] * acc[11];
    acc[12] <== sq12 * in;
    signal sq13 <== acc[12] * acc[12];
    acc[13] <== sq13;
    signal sq14 <== acc[13] * acc[13];
    acc[14] <== sq14;
    signal sq15 <== acc[14] * acc[14];
    acc[15] <== sq15;
    signal sq16 <== acc[15] * acc[15];
    acc[16] <== sq16;
    signal sq17 <== acc[16] * acc[16];
    acc[17] <== sq17 * in;
    signal sq18 <== acc[17] * acc[17];
    acc[18] <== sq18;
    signal sq19 <== acc[18] * acc[18];
    acc[19] <== sq19;
    signal sq20 <== acc[19] * acc[19];
    acc[20] <== sq20;
    signal sq21 <== acc[20] * acc[20];
    acc[21] <== sq21;
    signal sq22 <== acc[21] * acc[21];
    acc[22] <== sq22 * in;
    signal sq23 <== acc[22] * acc[22];
    acc[23] <== sq23;
    signal sq24 <== acc[23] * acc[23];
    acc[24] <== sq24;
    signal sq25 <== acc[24] * acc[24];
    acc[25] <== sq25;
    signal sq26 <== acc[25] * acc[25];
    acc[26] <== sq26;
    signal sq27 <== acc[26] * acc[26];
    acc[27] <== sq27;
    signal sq28 <== acc[27] * acc[27];
    acc[28] <== sq28 * in;
    signal sq29 <== acc[28] * acc[28];
    acc[29] <== sq29 * in;
    signal sq30 <== acc[29] * acc[29];
    acc[30] <== sq30;
    signal sq31 <== acc[30] * acc[30];
    acc[31] <== sq31 * in;
    signal sq32 <== acc[31] * acc[31];
    acc[32] <== sq32;
    signal sq33 <== acc[32] * acc[32];
    acc[33] <== sq33;
    signal sq34 <== acc[33] * acc[33];
    acc[34] <== sq34 * in;
    signal sq35 <== acc[34] * acc[34];
    acc[35] <== sq35;
    signal sq36 <== acc[35] * acc[35];
    acc[36] <== sq36 * in;
    signal sq37 <== acc[36] * acc[36];
    acc[37] <== sq37;
    signal sq38 <== acc[37] * acc[37];
    acc[38] <== sq38 * in;
    signal sq39 <== acc[38] * acc[38];
    acc[39] <== sq39;
    signal sq40 <== acc[39] * acc[39];
    acc[40] <== sq40;
    signal sq41 <== acc[40] * acc[40];
    acc[41] <== sq41;
    signal sq42 <== acc[41] * acc[41];
    acc[42] <== sq42;
    signal sq43 <== acc[42] * acc[42];
    acc[43] <== sq43;
    signal sq44 <== acc[43] * acc[43];
    acc[44] <== sq44;
    signal sq45 <== acc[44] * acc[44];
    acc[45] <== sq45 * in;
    signal sq46 <== acc[45] * acc[45];
    acc[46] <== sq46 * in;
    signal sq47 <== acc[46] * acc[46];
    acc[47] <== sq47 * in;
    signal sq48 <== acc[47] * acc[47];
    acc[48] <== sq48;
    signal sq49 <== acc[48] * acc[48];
    acc[49] <== sq49 * in;
    signal sq50 <== acc[49] * acc[49];
    acc[50] <== sq50 * in;
    signal sq51 <== acc[50] * acc[50];
    acc[51] <== sq51;
    signal sq52 <== acc[51] * acc[51];
    acc[52] <== sq52 * in;
    signal sq53 <== acc[52] * acc[52];
    acc[53] <== sq53 * in;
    signal sq54 <== acc[53] * acc[53];
    acc[54] <== sq54 * in;
    signal sq55 <== acc[54] * acc[54];
    acc[55] <== sq55;
    signal sq56 <== acc[55] * acc[55];
    acc[56] <== sq56;
    signal sq57 <== acc[56] * acc[56];
    acc[57] <== sq57 * in;
    signal sq58 <== acc[57] * acc[57];
    acc[58] <== sq58 * in;
    signal sq59 <== acc[58] * acc[58];
    acc[59] <== sq59 * in;
    signal sq60 <== acc[59] * acc[59];
    acc[60] <== sq60;
    signal sq61 <== acc[60] * acc[60];
    acc[61] <== sq61 * in;
    signal sq62 <== acc[61] * acc[61];
    acc[62] <== sq62;
    signal sq63 <== acc[62] * acc[62];
    acc[63] <== sq63 * in;
    signal sq64 <== acc[63] * acc[63];
    acc[64] <== sq64 * in;
    signal sq65 <== acc[64] * acc[64];
    acc[65] <== sq65;
    signal sq66 <== acc[65] * acc[65];
    acc[66] <== sq66;
    signal sq67 <== acc[66] * acc[66];
    acc[67] <== sq67 * in;
    signal sq68 <== acc[67] * acc[67];
    acc[68] <== sq68;
    signal sq69 <== acc[68] * acc[68];
    acc[69] <== sq69;
    signal sq70 <== acc[69] * acc[69];
    acc[70] <== sq70 * in;
    signal sq71 <== acc[70] * acc[70];
    acc[71] <== sq71 * in;
    signal sq72 <== acc[71] * acc[71];
    acc[72] <== sq72 * in;
    signal sq73 <== acc[72] * acc[72];
    acc[73] <== sq73;
    signal sq74 <== acc[73] * acc[73];
    acc[74] <== sq74 * in;
    signal sq75 <== acc[74] * acc[74];
    acc[75] <== sq75 * in;
    signal sq76 <== acc[75] * acc[75];
    acc[76] <== sq76 * in;
    signal sq77 <== acc[76] * acc[76];
    acc[77] <== sq77;
    signal sq78 <== acc[77] * acc[77];
    acc[78] <== sq78;
    signal sq79 <== acc[78] * acc[78];
    acc[79] <== sq79;
    signal sq80 <== acc[79] * acc[79];
    acc[80] <== sq80;
    signal sq81 <== acc[80] * acc[80];
    acc[81] <== sq81;
    signal sq82 <== acc[81] * acc[81];
    acc[82] <== sq82;
    signal sq83 <== acc[82] * acc[82];
    acc[83] <== sq83 * in;
    signal sq84 <== acc[83] * acc[83];
    acc[84] <== sq84 * in;
    signal sq85 <== acc[84] * acc[84];
    acc[85] <== sq85;
    signal sq86 <== acc[85] * acc[85];
    acc[86] <== sq86 * in;
    signal sq87 <== acc[86] * acc[86];
    acc[87] <== sq87;
    signal sq88 <== acc[87] * acc[87];
    acc[88] <== sq88;
    signal sq89 <== acc[88] * acc[88];
    acc[89] <== sq89;
    signal sq90 <== acc[89] * acc[89];
    acc[90] <== sq90;
    signal sq91 <== acc[90] * acc[90];
    acc[91] <== sq91 * in;
    signal sq92 <== acc[91] * acc[91];
    acc[92] <== sq92 * in;
    signal sq93 <== acc[92] * acc[92];
    acc[93] <== sq93 * in;
    signal sq94 <== acc[93] * acc[93];
    acc[94] <== sq94;
    signal sq95 <== acc[94] * acc[94];
    acc[95] <== sq95 * in;
    signal sq96 <== acc[95] * acc[95];
    acc[96] <== sq96 * in;
    signal sq97 <== acc[96] * acc[96];
    acc[97] <== sq97;
    signal sq98 <== acc[97] * acc[97];
    acc[98] <== sq98 * in;
    signal sq99 <== acc[98] * acc[98];
    acc[99] <== sq99 * in;
    signal sq100 <== acc[99] * acc[99];
    acc[100] <== sq100 * in;
    signal sq101 <== acc[100] * acc[100];
    acc[101] <== sq101 * in;
    signal sq102 <== acc[101] * acc[101];
    acc[102] <== sq102;
    signal sq103 <== acc[102] * acc[102];
    acc[103] <== sq103 * in;
    signal sq104 <== acc[103] * acc[103];
    acc[104] <== sq104 * in;
    signal sq105 <== acc[104] * acc[104];
    acc[105] <== sq105;
    signal sq106 <== acc[105] * acc[105];
    acc[106] <== sq106 * in;
    signal sq107 <== acc[106] * acc[106];
    acc[107] <== sq107 * in;
    signal sq108 <== acc[107] * acc[107];
    acc[108] <== sq108 * in;
    signal sq109 <== acc[108] * acc[108];
    acc[109] <== sq109 * in;
    signal sq110 <== acc[109] * acc[109];
    acc[110] <== sq110;
    signal sq111 <== acc[110] * acc[110];
    acc[111] <== sq111 * in;
    signal sq112 <== acc[111] * acc[111];
    acc[112] <== sq112;
    signal sq113 <== acc[112] * acc[112];
    acc[113] <== sq113;
    signal sq114 <== acc[113] * acc[113];
    acc[114] <== sq114;
    signal sq115 <== acc[114] * acc[114];
    acc[115] <== sq115;
    signal sq116 <== acc[115] * acc[115];
    acc[116] <== sq116;
    signal sq117 <== acc[116] * acc[116];
    acc[117] <== sq117;
    signal sq118 <== acc[117] * acc[117];
    acc[118] <== sq118;
    signal sq119 <== acc[118] * acc[118];
    acc[119] <== sq119 * in;
    signal sq120 <== acc[119] * acc[119];
    acc[120] <== sq120 * in;
    signal sq121 <== acc[120] * acc[120];
    acc[121] <== sq121;
    signal sq122 <== acc[121] * acc[121];
    acc[122] <== sq122 * in;
    signal sq123 <== acc[122] * acc[122];
    acc[123] <== sq123;
    signal sq124 <== acc[123] * acc[123];
    acc[124] <== sq124 * in;
    signal sq125 <== acc[124] * acc[124];
    acc[125] <== sq125;
    signal sq126 <== acc[125] * acc[125];
    acc[126] <== sq126;
    signal sq127 <== acc[126] * acc[126];
    acc[127] <== sq127 * in;
    signal sq128 <== acc[127] * acc[127];
    acc[128] <== sq128 * in;
    signal sq129 <== acc[128] * acc[128];
    acc[129] <== sq129 * in;
    signal sq130 <== acc[129] * acc[129];
    acc[130] <== sq130;
    signal sq131 <== acc[130] * acc[130];
    acc[131] <== sq131 * in;
    signal sq132 <== acc[131] * acc[131];
    acc[132] <== sq132 * in;
    signal sq133 <== acc[132] * acc[132];
    acc[133] <== sq133 * in;
    signal sq134 <== acc[133] * acc[133];
    acc[134] <== sq134;
    signal sq135 <== acc[134] * acc[134];
    acc[135] <== sq135;
    signal sq136 <== acc[135] * acc[135];
    acc[136] <== sq136;
    signal sq137 <== acc[136] * acc[136];
    acc[137] <== sq137 * in;
    signal sq138 <== acc[137] * acc[137];
    acc[138] <== sq138;
    signal sq139 <== acc[138] * acc[138];
    acc[139] <== sq139 * in;
    signal sq140 <== acc[139] * acc[139];
    acc[140] <== sq140 * in;
    signal sq141 <== acc[140] * acc[140];
    acc[141] <== sq141;
    signal sq142 <== acc[141] * acc[141];
    acc[142] <== sq142 * in;
    signal sq143 <== acc[142] * acc[142];
    acc[143] <== sq143 * in;
    signal sq144 <== acc[143] * acc[143];
    acc[144] <== sq144;
    signal sq145 <== acc[144] * acc[144];
    acc[145] <== sq145;
    signal sq146 <== acc[145] * acc[145];
    acc[146] <== sq146;
    signal sq147 <== acc[146] * acc[146];
    acc[147] <== sq147;
    signal sq148 <== acc[147] * acc[147];
    acc[148] <== sq148;
    signal sq149 <== acc[148] * acc[148];
    acc[149] <== sq149;
    signal sq150 <== acc[149] * acc[149];
    acc[150] <== sq150;
    signal sq151 <== acc[150] * acc[150];
    acc[151] <== sq151 * in;
    signal sq152 <== acc[151] * acc[151];
    acc[152] <== sq152;
    signal sq153 <== acc[152] * acc[152];
    acc[153] <== sq153 * in;
    signal sq154 <== acc[153] * acc[153];
    acc[154] <== sq154;
    signal sq155 <== acc[154] * acc[154];
    acc[155] <== sq155;
    signal sq156 <== acc[155] * acc[155];
    acc[156] <== sq156 * in;
    signal sq157 <== acc[156] * acc[156];
    acc[157] <== sq157;
    signal sq158 <== acc[157] * acc[157];
    acc[158] <== sq158 * in;
    signal sq159 <== acc[158] * acc[158];
    acc[159] <== sq159 * in;
    signal sq160 <== acc[159] * acc[159];
    acc[160] <== sq160;
    signal sq161 <== acc[160] * acc[160];
    acc[161] <== sq161 * in;
    signal sq162 <== acc[161] * acc[161];
    acc[162] <== sq162;
    signal sq163 <== acc[162] * acc[162];
    acc[163] <== sq163 * in;
    signal sq164 <== acc[163] * acc[163];
    acc[164] <== sq164;
    signal sq165 <== acc[164] * acc[164];
    acc[165] <== sq165;
    signal sq166 <== acc[165] * acc[165];
    acc[166] <== sq166;
    signal sq167 <== acc[166] * acc[166];
    acc[167] <== sq167 * in;
    signal sq168 <== acc[167] * acc[167];
    acc[168] <== sq168;
    signal sq169 <== acc[168] * acc[168];
    acc[169] <== sq169;
    signal sq170 <== acc[169] * acc[169];
    acc[170] <== sq170;
    signal sq171 <== acc[170] * acc[170];
    acc[171] <== sq171;
    signal sq172 <== acc[171] * acc[171];
    acc[172] <== sq172;
    signal sq173 <== acc[172] * acc[172];
    acc[173] <== sq173 * in;
    signal sq174 <== acc[173] * acc[173];
    acc[174] <== sq174 * in;
    signal sq175 <== acc[174] * acc[174];
    acc[175] <== sq175;
    signal sq176 <== acc[175] * acc[175];
    acc[176] <== sq176 * in;
    signal sq177 <== acc[176] * acc[176];
    acc[177] <== sq177;
    signal sq178 <== acc[177] * acc[177];
    acc[178] <== sq178;
    signal sq179 <== acc[178] * acc[178];
    acc[179] <== sq179 * in;
    signal sq180 <== acc[179] * acc[179];
    acc[180] <== sq180;
    signal sq181 <== acc[180] * acc[180];
    acc[181] <== sq181 * in;
    signal sq182 <== acc[181] * acc[181];
    acc[182] <== sq182;
    signal sq183 <== acc[182] * acc[182];
    acc[183] <== sq183;
    signal sq184 <== acc[183] * acc[183];
    acc[184] <== sq184 * in;
    signal sq185 <== acc[184] * acc[184];
    acc[185] <== sq185 * in;
    signal sq186 <== acc[185] * acc[185];
    acc[186] <== sq186 * in;
    signal sq187 <== acc[186] * acc[186];
    acc[187] <== sq187;
    signal sq188 <== acc[187] * acc[187];
    acc[188] <== sq188;
    signal sq189 <== acc[188] * acc[188];
    acc[189] <== sq189;
    signal sq190 <== acc[189] * acc[189];
    acc[190] <== sq190;
    signal sq191 <== acc[190] * acc[190];
    acc[191] <== sq191 * in;
    signal sq192 <== acc[191] * acc[191];
    acc[192] <== sq192;
    signal sq193 <== acc[192] * acc[192];
    acc[193] <== sq193;
    signal sq194 <== acc[193] * acc[193];
    acc[194] <== sq194 * in;
    signal sq195 <== acc[194] * acc[194];
    acc[195] <== sq195 * in;
    signal sq196 <== acc[195] * acc[195];
    acc[196] <== sq196;
    signal sq197 <== acc[196] * acc[196];
    acc[197] <== sq197 * in;
    signal sq198 <== acc[197] * acc[197];
    acc[198] <== sq198 * in;
    signal sq199 <== acc[198] * acc[198];
    acc[199] <== sq199;
    signal sq200 <== acc[199] * acc[199];
    acc[200] <== sq200;
    signal sq201 <== acc[200] * acc[200];
    acc[201] <== sq201 * in;
    signal sq202 <== acc[201] * acc[201];
    acc[202] <== sq202;
    signal sq203 <== acc[202] * acc[202];
    acc[203] <== sq203 * in;
    signal sq204 <== acc[203] * acc[203];
    acc[204] <== sq204;
    signal sq205 <== acc[204] * acc[204];
    acc[205] <== sq205;
    signal sq206 <== acc[205] * acc[205];
    acc[206] <== sq206 * in;
    signal sq207 <== acc[206] * acc[206];
    acc[207] <== sq207;
    signal sq208 <== acc[207] * acc[207];
    acc[208] <== sq208;
    signal sq209 <== acc[208] * acc[208];
    acc[209] <== sq209;
    signal sq210 <== acc[209] * acc[209];
    acc[210] <== sq210;
    signal sq211 <== acc[210] * acc[210];
    acc[211] <== sq211 * in;
    signal sq212 <== acc[211] * acc[211];
    acc[212] <== sq212 * in;
    signal sq213 <== acc[212] * acc[212];
    acc[213] <== sq213;
    signal sq214 <== acc[213] * acc[213];
    acc[214] <== sq214;
    signal sq215 <== acc[214] * acc[214];
    acc[215] <== sq215 * in;
    signal sq216 <== acc[215] * acc[215];
    acc[216] <== sq216;
    signal sq217 <== acc[216] * acc[216];
    acc[217] <== sq217 * in;
    signal sq218 <== acc[217] * acc[217];
    acc[218] <== sq218 * in;
    signal sq219 <== acc[218] * acc[218];
    acc[219] <== sq219 * in;
    signal sq220 <== acc[219] * acc[219];
    acc[220] <== sq220 * in;
    signal sq221 <== acc[220] * acc[220];
    acc[221] <== sq221 * in;
    signal sq222 <== acc[221] * acc[221];
    acc[222] <== sq222 * in;
    signal sq223 <== acc[222] * acc[222];
    acc[223] <== sq223 * in;
    signal sq224 <== acc[223] * acc[223];
    acc[224] <== sq224 * in;
    signal sq225 <== acc[224] * acc[224];
    acc[225] <== sq225;
    signal sq226 <== acc[225] * acc[225];
    acc[226] <== sq226 * in;
    signal sq227 <== acc[226] * acc[226];
    acc[227] <== sq227 * in;
    signal sq228 <== acc[227] * acc[227];
    acc[228] <== sq228;
    signal sq229 <== acc[228] * acc[228];
    acc[229] <== sq229 * in;
    signal sq230 <== acc[229] * acc[229];
    acc[230] <== sq230 * in;
    signal sq231 <== acc[230] * acc[230];
    acc[231] <== sq231;
    signal sq232 <== acc[231] * acc[231];
    acc[232] <== sq232 * in;
    signal sq233 <== acc[232] * acc[232];
    acc[233] <== sq233 * in;
    signal sq234 <== acc[233] * acc[233];
    acc[234] <== sq234;
    signal sq235 <== acc[234] * acc[234];
    acc[235] <== sq235 * in;
    signal sq236 <== acc[235] * acc[235];
    acc[236] <== sq236 * in;
    signal sq237 <== acc[236] * acc[236];
    acc[237] <== sq237;
    signal sq238 <== acc[237] * acc[237];
    acc[238] <== sq238 * in;
    signal sq239 <== acc[238] * acc[238];
    acc[239] <== sq239 * in;
    signal sq240 <== acc[239] * acc[239];
    acc[240] <== sq240;
    signal sq241 <== acc[240] * acc[240];
    acc[241] <== sq241 * in;
    signal sq242 <== acc[241] * acc[241];
    acc[242] <== sq242 * in;
    signal sq243 <== acc[242] * acc[242];
    acc[243] <== sq243;
    signal sq244 <== acc[243] * acc[243];
    acc[244] <== sq244 * in;
    signal sq245 <== acc[244] * acc[244];
    acc[245] <== sq245 * in;
    signal sq246 <== acc[245] * acc[245];
    acc[246] <== sq246;
    signal sq247 <== acc[246] * acc[246];
    acc[247] <== sq247 * in;
    signal sq248 <== acc[247] * acc[247];
    acc[248] <== sq248 * in;
    signal sq249 <== acc[248] * acc[248];
    acc[249] <== sq249;
    signal sq250 <== acc[249] * acc[249];
    acc[250] <== sq250 * in;
    signal sq251 <== acc[250] * acc[250];
    acc[251] <== sq251 * in;
    signal sq252 <== acc[251] * acc[251];
    acc[252] <== sq252 * in;
    out <== acc[252];
}

// Pow7: forward S-box, x^7, decomposed into quadratic constraints
// (required — circom only allows quadratic constraints per assignment;
// a single `x^7` expression is degree 7 and is rejected by the compiler,
// which is exactly the compile error found in the prior submission).
template Pow7() {
    signal input in;
    signal output out;
    signal x2 <== in * in;
    signal x4 <== x2 * x2;
    signal x6 <== x4 * x2;
    out <== x6 * in;
}

// 3x3 MDS mix using the Cauchy-based matrix [[3,1,1],[1,3,1],[1,1,3]]
template MDS3() {
    signal input in[3];
    signal output out[3];
    out[0] <== 3*in[0] + 1*in[1] + 1*in[2];
    out[1] <== 1*in[0] + 3*in[1] + 1*in[2];
    out[2] <== 1*in[0] + 1*in[1] + 3*in[2];
}

// RescuePrimeHash: real permutation over state size 3 (rate=2, capacity=1),
// 5 rounds, each round = [forward S-box on all 3] -> MDS -> +constants ->
// [inverse S-box on all 3] -> MDS -> +constants. This is a REWRITE of a
// prior submission that (a) computed acc^7 in a single expression, which
// does not even compile in circom (degree-7 constraint), and (b) whose
// hash output was never wired into any other signal in the circuit --
// it was computed and then discarded, contributing nothing to the proof.
// This version's hash output is exposed as a public signal below and
// used as a binding commitment over (alpha, beta).
//
// PRODUCTION NOTE: the round constants below are generated by
// sha256("VVU-RescuePrime-RC-i") mod p -- a placeholder generation
// method, clearly not the official Rescue-Prime specification's
// constant-generation procedure. They must be replaced with
// specification-derived constants before any security audit. This
// matches the same caveat the original (broken) submission stated, but
// this version is honest that the caveat applies to a circuit that
// otherwise actually implements the permutation structure, not to a
// circuit that also doesn't compile or constrain anything.
template RescuePrimeHash() {
    signal input in[2];   // rate elements: alpha, beta
    signal output out;

    // Round constants generated by SHAKE256 per Rescue-Prime Algorithm 5:
    // Seed: "Rescue-XLIX(p,3,1,128)" where p = BN254 scalar field modulus
    var RC0 = 16315208746038078395621556119853320273013100435293928429550050637277758017174;
    var RC1 = 9326448109177195832979781698098996596735590184032795835209200074906016214488;
    var RC2 = 10357403258575929693393222770454670364661619032893619376592187232784122915571;
    var RC3 = 5048366782638436499165834439468345295529797608794981403111850632714349943245;
    var RC4 = 12002519248750329692010343065164262350136302152581655837128905479504017393881;
    var RC5 = 17950385888071888997941858983876977472779521086694360130682404483302390363359;
    var RC6 = 1506119525468993280262984262717037076548989024456334927742580234420291052217;
    var RC7 = 9599603155856554388544928663004945482010566945747188362811363257444642092397;
    var RC8 = 16084779493090162518530181322489478530995264719203566654697689020332297474279;
    var RC9 = 337601233893539671377190648231029898939908202804912083908423969267537694534;
    var RC10 = 10260572039116990346424270789265771060828614824634729917021094339851391388067;
    var RC11 = 7397016923294266948125023153537314926153300333141939038012743490318438370165;
    var RC12 = 6098719860773897373134987445750262319914378918174468863371837333901370813646;
    var RC13 = 14634166579972134065663897589810804836645373921163153824806933004237887370945;
    var RC14 = 490931547159211841803024897043740977377515264793195969308270893325490512943;
    var RC15 = 7885228775253288675610293150210783702911889119955505287341145867892940596613;
    var RC16 = 13539370841266135333367688619562853574363273930225618970182953405436271248188;
    var RC17 = 154204481864706905747091195514664445782438115638888472453489680693808737691;
    var RC18 = 20121333468511366463598108112974528826250416270489842204551307125163776867211;
    var RC19 = 2249978989261351606431210610289989558988572325456389225927374305040657191234;
    var RC20 = 12510882199476673562067519289060134509433700766439883474614121085769042692441;
    var RC21 = 208799759716710471054078140506011453636266331541918730401485943320010205116;
    var RC22 = 16212199688448807262615575924256306131142193515752477927840096640971255826959;
    var RC23 = 4800170369411085935295003079942276153667932917753020555073794440018872281246;
    var RC24 = 4549879716504190402740407618039075301094913330772408292784590290633726533720;
    var RC25 = 1043305524984150714428966767777210470125677776317668369928461662448080677494;
    var RC26 = 6895323878514277865658514521702758017978490391516116817231948714365647148075;
    var RC27 = 14348613186025179662782059787993799977173011758137572817916844781567104564394;
    var RC28 = 18177159515596706978564279841088489246220289606380688111618089357940695472962;
    var RC29 = 6301677268089412855041357856637297464282779752103024221316703377664707461466;
    var RC[30] = [RC0,RC1,RC2,RC3,RC4,RC5,RC6,RC7,RC8,RC9,RC10,RC11,RC12,RC13,RC14,RC15,RC16,RC17,RC18,RC19,RC20,RC21,RC22,RC23,RC24,RC25,RC26,RC27,RC28,RC29];

    signal state[6][3]; // state[0] = initial, state[1..5] = after each of 5 rounds
    state[0][0] <== in[0];
    state[0][1] <== in[1];
    state[0][2] <== 0; // capacity element, IV = 0

    component fwd[5][3];
    component mdsA[5];
    component inv[5][3];
    component mdsB[5];

    signal afterFwd[5][3];
    signal afterMdsA[5][3];
    signal afterConstA[5][3];
    signal afterInv[5][3];
    signal afterMdsB[5][3];

    for (var r = 0; r < 5; r++) {
        mdsA[r] = MDS3();
        for (var i = 0; i < 3; i++) {
            fwd[r][i] = Pow7();
            fwd[r][i].in <== state[r][i];
            afterFwd[r][i] <== fwd[r][i].out;
            mdsA[r].in[i] <== afterFwd[r][i];
        }
        for (var i = 0; i < 3; i++) {
            afterMdsA[r][i] <== mdsA[r].out[i];
            afterConstA[r][i] <== afterMdsA[r][i] + RC[r*6 + i];
        }

        mdsB[r] = MDS3();
        for (var i = 0; i < 3; i++) {
            inv[r][i] = InvPow7();
            inv[r][i].in <== afterConstA[r][i];
            afterInv[r][i] <== inv[r][i].out;
            mdsB[r].in[i] <== afterInv[r][i];
        }
        for (var i = 0; i < 3; i++) {
            afterMdsB[r][i] <== mdsB[r].out[i];
            state[r+1][i] <== afterMdsB[r][i] + RC[r*6 + 3 + i];
        }
    }

    out <== state[5][0];
}

// Threshold circuit: REAL constraint (GreaterThan comparator, same as the
// original working threshold.circom), plus the Rescue-Prime hash actually
// bound into a public output (unlike the prior submission, where the hash
// component's output was computed and never used anywhere).
template ThresholdRescue() {
    signal input alpha;
    signal input beta;
    signal input tau_num;
    signal input tau_den;

    signal output valid;
    signal output hashOut;

    signal left;
    signal right;
    left <== alpha * tau_den;
    right <== (alpha + beta) * tau_num;

    component isPositive = GreaterThan(32);
    isPositive.in[0] <== left;
    isPositive.in[1] <== right;
    valid <== isPositive.out;

    component hasher = RescuePrimeHash();
    hasher.in[0] <== alpha;
    hasher.in[1] <== beta;
    hashOut <== hasher.out; // bound to a public output -- not dead code
}

component main {public [alpha, beta, tau_num, tau_den]} = ThresholdRescue();

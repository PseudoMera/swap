export interface GetParams {
  address?: string;
  height: number;
}

export interface ConsensusParams {
  blockSize: number;
  protocolVersion: string;
  rootChainID: number;
}

export interface ValidatorParams {
  unstakingBlocks: number;
  maxPauseBlocks: number;
  doubleSignSlashPercentage: number;
  nonSignSlashPercentage: number;
  maxNonSign: number;
  nonSignWindow: number;
  maxCommittees: number;
  maxCommitteeSize: number;
  earlyWithdrawalPenalty: number;
  delegateUnstakingBlocks: number;
  minimumOrderSize: number;
  stakePercentForSubsidizedCommittee: number;
  maxSlashPerCommittee: number;
  delegateRewardPercentage: number;
  buyDeadlineBlocks: number;
  lockOrderFeeMultiplier: number;
}

export interface FeeParams {
  sendFee: number;
  stakeFee: number;
  editStakeFee: number;
  unstakeFee: number;
  pauseFee: number;
  unpauseFee: number;
  changeParameterFee: number;
  daoTransferFee: number;
  certificateResultsFee: number;
  subsidyFee: number;
  createOrderFee: number;
  editOrderFee: number;
  deleteOrderFee: number;
}

export interface GovernanceParams {
  daoRewardPercentage: number;
}

export interface NetworkParameters {
  consensus: ConsensusParams;
  validator: ValidatorParams;
  fee: FeeParams;
  governance: GovernanceParams;
}

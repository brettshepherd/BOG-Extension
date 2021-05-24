export interface Pair {
  address: string;
  BUSD: boolean;
  name: string;
  price?: number;
}

import {
  BEP20ABI,
  BNBAddress,
  FACTORY_ABI,
  PAIR_ABI,
  PancakeV1FactoryAddress,
  PancakeV2FactoryAddress,
  ApeFactoryAddress
} from "./abi";
import Web3 from "web3";
import { BUSDAddress } from "./abi";

export class Token {
  decimals: number;
  contract: any;
  pairContract: any;
  price: number;
  balance: number;
  factoryList: {
    [key: string]: { address: string; name: string };
  } = {
    [PancakeV1FactoryAddress]: {
      address: PancakeV1FactoryAddress,
      name: "PSv1"
    },
    [PancakeV2FactoryAddress]: {
      address: PancakeV2FactoryAddress,
      name: "PSv2"
    },
    [ApeFactoryAddress]: {
      address: ApeFactoryAddress,
      name: "APE"
    }
  };
  highestPair: Pair;
  pancakeFactoryContract: any;
  constructor(private web3: Web3, private address: string) {}

  init(): Promise<boolean> {
    return new Promise(async (res, rej) => {
      try {
        //   fetch contract
        this.contract = new this.web3.eth.Contract(
          BEP20ABI as any,
          this.address
        );
        this.decimals = parseInt(await this.contract.methods.decimals().call());

        // fetch pairs
        const pairPromises = this.getAllPairs();

        let results = await (Promise as any).allSettled(pairPromises);

        const pairs = results
          .filter((res) => res.status === "fulfilled")
          .map((res) => res.value);

        // fetch prices for each pair
        this.highestPair = await this.getHighestPair(pairs);

        res(true);
      } catch (error) {
        rej(error);
      }
    });
  }

  async setPrice(needsUpdate?: boolean): Promise<Pair> {
    // get BNB Price
    if (needsUpdate) {
      try {
        this.highestPair = await this.fetchPairPrice(this.highestPair);
      } catch (error) {
        console.log(error);
      }
    }
    if (!this.highestPair.BUSD) {
      const BNBPrice = await this.getBNBPrice();
      this.highestPair.price *= BNBPrice;
      return this.highestPair;
    } else {
      return this.highestPair;
    }
  }

  getAllPairs(): Promise<Pair>[] {
    let promises: Promise<Pair>[] = [];

    for (const key in this.factoryList) {
      const factory = this.factoryList[key];
      promises.push(this.getPair(factory.address, factory.name));
    }

    return promises;
  }

  async getPair(factoryAddress: string, name: string): Promise<Pair> {
    // create factory contract
    const factoryContract = new this.web3.eth.Contract(
      FACTORY_ABI as any,
      factoryAddress
    );

    let pairAddress: string;
    let BUSD: boolean;

    if (this.address !== BNBAddress) {
      pairAddress = await factoryContract.methods
        .getPair(BNBAddress, this.address)
        .call();
    }
    // check for BNB
    else {
      BUSD = true;
      pairAddress = await factoryContract.methods
        .getPair(BUSDAddress, this.address)
        .call();
    }

    if (!pairAddress) {
      BUSD = true;
      pairAddress = await factoryContract.methods
        .getPair(BUSDAddress, this.address)
        .call();
    }
    return { address: pairAddress, BUSD, name };
  }

  async getHighestPair(_pairs: Pair[]) {
    const pricePromises: Promise<Pair>[] = _pairs.map((pair) =>
      this.fetchPairPrice(pair)
    );

    let results = await (Promise as any).allSettled(pricePromises);

    const pricedPairs: Pair[] = results
      .filter((res) => res.status === "fulfilled")
      .map((res) => res.value);

    let highestPair: Pair;
    for (let i = 0; i < pricedPairs.length; i++) {
      if (!highestPair || pricedPairs[i].price > highestPair.price) {
        highestPair = pricedPairs[i];
      }
    }

    return highestPair;
  }

  fetchPairPrice(pair: Pair): Promise<Pair> {
    return new Promise(async (res, rej) => {
      try {
        const pairContract = new this.web3.eth.Contract(
          PAIR_ABI as any,
          pair.address
        );

        const token0 = await pairContract.methods.token0().call();
        const reserves = await pairContract.methods.getReserves().call();
        let price;
        // BNB Pair
        if (!pair.BUSD) {
          //   Divide BNB supply by token supply
          if (token0 !== BNBAddress) {
            pair.price =
              (parseFloat(reserves._reserve1) /
                parseFloat(reserves._reserve0)) *
              10 ** (-18 + this.decimals);
          } else {
            pair.price =
              (parseFloat(reserves._reserve0) /
                parseFloat(reserves._reserve1)) *
              10 ** (-18 + this.decimals);
          }
        }
        // BUSD Pair
        else {
          //   Divide BNB supply by token supply
          if (token0 !== BUSDAddress) {
            pair.price =
              (parseFloat(reserves._reserve1) /
                parseFloat(reserves._reserve0)) *
              10 ** (-18 + this.decimals);
          } else {
            pair.price =
              (parseFloat(reserves._reserve0) /
                parseFloat(reserves._reserve1)) *
              10 ** (-18 + this.decimals);
          }
        }

        res(pair);
      } catch (error) {
        rej(this.address + error);
      }
    });
  }

  async getBNBPrice(): Promise<number> {
    const BNBpairContract = new this.web3.eth.Contract(
      PAIR_ABI as any,
      "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16"
    );
    const reserves = await BNBpairContract.methods.getReserves().call();
    return parseFloat(reserves._reserve1) / parseFloat(reserves._reserve0);
  }
}
